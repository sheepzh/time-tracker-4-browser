#!/bin/bash

# Exit immediately on error
set -e

exec 3>&1
exec 4>&2

# Global variable to store background process PID
NPM_PID=""

# Cleanup: kill npm watching process
cleanup() {
    if [ -n "$NPM_PID" ] && kill -0 "$NPM_PID" 2>/dev/null; then
        log_info "Stopping background build process (PID: $NPM_PID)..."
        kill "$NPM_PID" 2>/dev/null
        wait "$NPM_PID" 2>/dev/null
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
# No Color
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[ INFO]${NC} $1" >&4
}

log_success() {
    echo -e "${GREEN}[ SUCC]${NC} $1" >&4
}

log_warning() {
    echo -e "${YELLOW}[ WARN]${NC} $1" >&4
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&4
}

# Check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Command $1 not found, please install it first"
        return 1
    fi
    return 0
}

# Check web-ext version
check_web_ext_version() {
    log_info "Checking web-ext version..."
    if check_command web-ext; then
        local version
        version=$(web-ext --version 2>/dev/null || echo "0.0.0")
        log_info "Current web-ext version: $version"

        local major_version
        major_version=$(echo "$version" | cut -d. -f1)
        if [ "$major_version" -lt 4 ]; then
            log_warning "web-ext version might be too old, recommend upgrading to 4.1.0 or later"
            log_info "Run: npm install -g web-ext@latest"
        fi
    else
        log_error "web-ext is not installed"
        log_info "Please run: npm install -g web-ext@latest"
        exit 1
    fi
}

# Check adb installation
check_adb_installation() {
    log_info "Checking adb installation..."
    if check_command adb; then
        log_success "adb is installed"
    else
        log_error "adb not found, please install Android Platform Tools"
        log_info "You can install via Android Studio SDK Manager or run:"
        log_info "sdkmanager 'platform-tools'"
        exit 1
    fi
}

# Select device from connected Android devices
select_device() {
    log_info "Scanning for connected Android devices..."

    adb start-server > /dev/null 2>&1

    local device_array=()
    local devices_output
    devices_output=$(adb devices 2>/dev/null)

    while IFS= read -r device; do
        if [[ -n "$device" && "$device" != "List of devices attached" ]]; then
            device_array+=("$device")
        fi
    done < <(adb devices 2>/dev/null | awk 'NR>1 && /device$/ {print $1}')

    local device_count=${#device_array[@]}

    if [ "$device_count" -eq 0 ]; then
        log_error "No Android device or emulator found"
        log_info "Please ensure:"
        log_info "  1. Device is connected via USB"
        log_info "  2. USB debugging is enabled"
        log_info "  3. Firefox for Android Nightly is installed"
        log_info "  4. 'Remote debugging via USB' is enabled in Firefox"
        exit 1
    fi

    if [ "$device_count" -eq 1 ]; then
        local device_id="${device_array[0]}"
        log_success "Selected device: $device_id"
        echo "$device_id"
        return 0
    fi

    log_info "Multiple devices found:"
    echo >&3

    for i in "${!device_array[@]}"; do
        echo "  $((i+1)). ${device_array[$i]}" >&3
    done

    echo >&3
    read -p "Select device (1-${#device_array[@]}): " device_choice <&3

    if [[ "$device_choice" =~ ^[0-9]+$ ]] && [ "$device_choice" -ge 1 ] && [ "$device_choice" -le "${#device_array[@]}" ]; then
        local selected_device="${device_array[$((device_choice-1))]}"
        log_success "Selected device: $selected_device"
        echo "$selected_device"
    else
        log_error "Invalid selection"
        exit 1
    fi
}

# Check Firefox Nightly installation on specific device
check_firefox_nightly() {
    local device_id="$1"

    log_info "Checking Firefox Nightly installation on device $device_id..."

    local firefox_package="org.mozilla.fenix"

    if adb -s "$device_id" shell pm list packages | grep -q "$firefox_package"; then
        log_success "Firefox Nightly is installed on device $device_id"
    else
        log_warning "Firefox Nightly not detected on device $device_id"
        log_info "Package name should be: $firefox_package"
    fi
}

# Build and run extension on specific device
build_and_run_extension() {
    local device_id="$1"
    local extension_dir="dist_dev_firefox"
    
    # Clear existing extension directory
    if [ -d "$extension_dir" ]; then
        log_info "Clearing existing extension directory..."
        rm -rf "$extension_dir"
    fi
    
    # Start npm run dev:firefox in background
    log_info "Starting npm run dev:firefox in background..."
    npm run dev:firefox > /dev/null 2>&1 &
    NPM_PID=$!
    
    # Wait for manifest.json to be created
    local max_wait=60
    local wait_count=0
    log_info "Waiting for building finished..."
    
    while [ ! -f "$extension_dir/manifest.json" ] && [ $wait_count -lt $max_wait ]; do
        sleep 1
        wait_count=$((wait_count + 1))
        if [ $((wait_count % 5)) -eq 0 ]; then
            log_info "Still waiting for building finished... ($wait_count/$max_wait)"
        fi
    done
    
    if [ ! -f "$extension_dir/manifest.json" ]; then
        log_error "Building not finished yet after ${max_wait}s"
        cleanup
        exit 1
    fi
    
    log_success "Extension built successfully, manifest.json found"
    log_info "Background build process PID: $NPM_PID"

    log_info "Starting extension development server..."
    log_info "Command: web-ext run -t firefox-android --firefox-apk org.mozilla.fenix -s $extension_dir --adb-device $device_id --verbose"
    
    if web-ext run \
        -t firefox-android \
        --firefox-apk org.mozilla.fenix \
        -s "$extension_dir" \
        --adb-device "$device_id" \
        --verbose; then
        log_success "Extension development server started successfully"
    else
        log_error "Failed to start extension development server"
        exit 1
    fi
}

main() {
    echo -e "${BLUE}=== Android Extension Development One-Click Setup Script ===${NC}" >&3
    echo >&3

    # Check prerequisites
    check_web_ext_version
    check_adb_installation

    local selected_device
    selected_device=$(select_device)
    check_firefox_nightly "$selected_device"

    log_success "All prerequisite checks passed!"
    log_success "Target device: $selected_device"

    log_info "Do you want to build and run the extension now? (y/n): "
    read -n 1 -r <&3
    echo >&3
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_and_run_extension "$selected_device"
    else
        log_warning "Gave up to launch the extension"
        log_info "You can run the extension manually later:"
        log_info "web-ext run -t firefox-android --firefox-apk org.mozilla.fenix -s dist_dev_firefox --adb-device $selected_device"
    fi
}

# Show usage instructions
show_usage() {
    echo "Usage: $0" >&3
    echo >&3
    echo "Description:" >&3
    echo "  One-click script to build and run Android extension development" >&3
    echo "  Extension directory: dist_dev_firefox" >&3
    echo >&3
    echo "Prerequisites:" >&3
    echo "  - web-ext 4.1.0 or later" >&3
    echo "  - Android Platform Tools (adb)" >&3
    echo "  - Connected Android device with Firefox Nightly" >&3
    echo >&3
    echo "The script will:" >&3
    echo "  1. Detect all connected Android devices" >&3
    echo "  2. Let you select target device (if multiple)" >&3
    echo "  3. Build extension if needed (npm run dev:firefox)" >&3
    echo "  4. Run extension on selected device" >&3
}

# Handle help parameter
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

main