#!/bin/bash

# Exit immediately on error
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Source logging functions
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/lib/log.sh"

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)
            echo "linux"
            ;;
        Darwin*)
            echo "macos"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

# Check Node.js version
check_node_version() {
    if ! check_command node; then
        log_error "Node.js is not installed"
        log_info "Please install Node.js >= 22 from https://nodejs.org/"
        exit 1
    fi

    local node_version
    node_version=$(node -v | sed 's/v//')
    local major_version
    major_version=$(echo "$node_version" | cut -d. -f1)

    log_info "Current Node.js version: $node_version"

    if [ "$major_version" -lt 22 ]; then
        log_error "Node.js version must be >= 22"
        log_info "Current version: $node_version"
        log_info "Please upgrade Node.js from https://nodejs.org/"
        exit 1
    fi

    log_success "Node.js version check passed"
}

# Check npm
check_npm() {
    if ! check_command npm; then
        log_error "npm is not installed"
        log_info "npm should come with Node.js, please reinstall Node.js"
        exit 1
    fi

    local npm_version
    npm_version=$(npm -v)
    log_info "Current npm version: $npm_version"
    log_success "npm is available"
}

# Install global npm package (only if not installed)
install_global_package() {
    local package_name=$1
    if command -v "$package_name" &> /dev/null; then
        log_info "$package_name is already installed"
        return 0
    fi

    log_info "$package_name is not installed, installing..."
    if npm install -g "${package_name}@latest" &> /dev/null; then
        log_success "$package_name installed successfully"
    else
        log_error "Failed to install $package_name"
        exit 1
    fi
}

# Upgrade global npm package
upgrade_global_package() {
    local package_name=$1
    if ! command -v "$package_name" &> /dev/null; then
        log_warning "$package_name is not installed, skipping upgrade"
        return 0
    fi

    log_info "$package_name is already installed, upgrading..."
    if npm install -g "${package_name}@latest" &> /dev/null; then
        log_success "$package_name upgraded successfully"
    else
        log_error "Failed to upgrade $package_name"
        exit 1
    fi
}

# Install e2e dependencies
install_e2e_dependencies() {
    log_step "Installing e2e test dependencies..."

    if [ ! -d "$PROJECT_ROOT/node_modules/puppeteer" ]; then
        log_error "puppeteer is not installed. Please run 'npm install' first."
        exit 1
    fi

    local browser_path
    browser_path=$(node -e "try { const p = require('puppeteer'); console.log(p.executablePath()); } catch(e) { process.exit(1); }" 2>/dev/null)
    if [ -n "$browser_path" ] && [ -f "$browser_path" ]; then
        log_info "Browser is already downloaded"
    elif [ -f "$PROJECT_ROOT/node_modules/puppeteer/install.mjs" ]; then
        log_info "Downloading browser for puppeteer..."
        if node "$PROJECT_ROOT/node_modules/puppeteer/install.mjs" &> /dev/null; then
            log_success "Browser downloaded successfully"
        else
            log_error "Failed to download browser for puppeteer"
            exit 1
        fi
    else
        log_warning "puppeteer install script not found, browser may already be downloaded"
    fi

    install_global_package "http-server"
    install_global_package "pm2"

    log_success "E2E dependencies installed successfully"
}

# Upgrade e2e dependencies
upgrade_e2e_dependencies() {
    log_step "Upgrading e2e test dependencies..."

    upgrade_global_package "http-server"
    upgrade_global_package "pm2"

    log_success "E2E dependencies upgraded successfully"
}

# Build npm script output
build_npm_script() {
    local script_name=$1
    local output_dir=$2
    local is_required=${3:-true}

    log_step "Building $script_name output..."

    cd "$PROJECT_ROOT" || exit 1

    log_info "Running: npm run $script_name"
    local build_output
    local build_exit_code
    set +e
    build_output=$(npm run "$script_name" 2>&1)
    build_exit_code=$?
    set -e

    if [ $build_exit_code -eq 0 ]; then
        if [ -d "$PROJECT_ROOT/$output_dir" ]; then
            log_success "$script_name output built successfully in $output_dir/"
        else
            if [ "$is_required" = true ]; then
                log_error "$script_name output directory $output_dir/ not found after build"
                exit 1
            else
                log_warning "$script_name output directory $output_dir/ not found after build"
            fi
        fi
    else
        log_error "Failed to build $script_name output"
        echo "$build_output" >&2
        exit 1
    fi
}

# Build e2e output
build_e2e_output() {
    build_npm_script "dev:e2e" "dist_e2e" true
}

# Build production output (optional)
build_production_output() {
    build_npm_script "build" "dist_prod" false
}

# Start test servers
start_test_servers() {
    log_step "Starting test servers..."

    if ! command -v pm2 &> /dev/null || ! command -v http-server &> /dev/null; then
        log_error "pm2 or http-server is not installed. Please run setup first."
        exit 1
    fi

    cd "$PROJECT_ROOT" || exit 1

    # Check if servers are already running
    if pm2 list 2>/dev/null | grep -q "http-server.*12345" || pm2 list 2>/dev/null | grep -q "http-server.*12346"; then
        log_warning "Test servers might already be running"
        log_info "Stopping existing servers..."
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
    fi

    log_info "Starting test server on port 12345..."
    pm2 start "http-server ./test-e2e/example -p 12345" --name "e2e-server-1"

    log_info "Starting test server on port 12346..."
    pm2 start "http-server ./test-e2e/example -p 12346" --name "e2e-server-2"

    log_success "Test servers started"
    log_info "Server 1: http://127.0.0.1:12345"
    log_info "Server 2: http://127.0.0.1:12346"
    log_info "To stop servers, run: pm2 stop all && pm2 delete all"
    log_info "To view server logs, run: pm2 logs"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "E2E Test Environment Setup Script"
    echo ""
    echo "This script initializes the e2e testing environment and can build e2e outputs."
    echo "It installs/upgrades required dependencies and compiles the code for e2e testing."
    echo ""
    echo "Options:"
    echo "  --init, -i           Initialize e2e environment (install dependencies if not installed)"
    echo "  --upgrade, -u        Upgrade e2e dependencies (http-server, pm2)"
    echo "  --build, -b          Build e2e output (runs 'npm run dev:e2e')"
    echo "  --build-prod         Also build production output (runs 'npm run build')"
    echo "  --start-servers, -s  Start test servers (http-server on ports 12345 and 12346)"
    echo "  --all, -a            Run all steps (init + build + build-prod)"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --init                    # Install e2e dependencies (if not installed)"
    echo "  $0 --upgrade                 # Upgrade e2e dependencies"
    echo "  $0 --build                   # Build e2e output only"
    echo "  $0 --init --build            # Initialize and build"
    echo "  $0 --all                     # Initialize, build e2e and production outputs"
    echo "  $0 --build --start-servers   # Build and start test servers"
}

# Main function
main() {
    local do_init=false
    local do_upgrade=false
    local do_build=false
    local do_build_prod=false
    local do_start_servers=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --init|-i)
                do_init=true
                shift
                ;;
            --upgrade|-u)
                do_upgrade=true
                shift
                ;;
            --build|-b)
                do_build=true
                shift
                ;;
            --build-prod)
                do_build_prod=true
                shift
                ;;
            --start-servers|-s)
                do_start_servers=true
                shift
                ;;
            --all|-a)
                do_init=true
                do_build=true
                do_build_prod=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    if [ "$do_init" = false ] && [ "$do_upgrade" = false ] && [ "$do_build" = false ] && [ "$do_build_prod" = false ] && [ "$do_start_servers" = false ]; then
        show_usage
        exit 0
    fi

    if [ ! -f "package.json" ]; then
        log_error "Please run this script from the project root."
        exit 1
    fi

    echo -e "${CYAN}=== E2E Test Environment Setup ===${NC}"
    echo ""

    # Detect OS and show info
    local os_type
    os_type=$(detect_os)
    log_info "Detected OS: $os_type"

    if [ "$os_type" = "windows" ]; then
        log_warning "Running on Windows. Make sure you're using Git Bash or WSL."
    fi

    # Check prerequisites
    check_node_version
    check_npm

    # Run requested operations
    if [ "$do_init" = true ]; then
        install_e2e_dependencies
    fi

    if [ "$do_upgrade" = true ]; then
        upgrade_e2e_dependencies
    fi

    if [ "$do_build" = true ]; then
        build_e2e_output
    fi

    if [ "$do_build_prod" = true ]; then
        build_production_output
    fi

    if [ "$do_start_servers" = true ]; then
        start_test_servers
    fi

    log_success "All operations completed successfully!"
    log_info "Run e2e tests:"
    log_info "  1. npm run test-e2e"
    log_info "  2. USE_HEADLESS_PUPPETEER=true npm run test-e2e"
}

# Run main function
main "$@"