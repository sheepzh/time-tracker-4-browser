#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
# No Color
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[ INFO]${NC} $1" >&${LOG_FD:-1}
}

log_success() {
    echo -e "${GREEN}[ SUCC]${NC} $1" >&${LOG_FD:-1}
}

log_warning() {
    echo -e "${YELLOW}[ WARN]${NC} $1" >&${LOG_FD:-1}
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&${LOG_FD:-1}
}

log_step() {
    echo -e "${CYAN}[ STEP]${NC} $1" >&${LOG_FD:-1}
}

