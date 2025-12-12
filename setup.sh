#!/bin/bash

# WazMind Setup Script
# This script automates the setup process for WazMind

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    local missing=0
    
    # Check Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
        
        # Check Python version (3.10+)
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
            print_error "Python 3.10+ required. Found: $PYTHON_VERSION"
            missing=1
        fi
    else
        print_error "Python 3.10+ not found. Please install Python 3.10 or higher."
        missing=1
    fi
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        print_success "Node.js $NODE_VERSION found"
        
        # Check Node.js version (18+)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_error "Node.js 18+ required. Found: $NODE_VERSION"
            missing=1
        fi
    else
        print_error "Node.js 18+ not found. Please install Node.js 18 or higher."
        missing=1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION found"
    else
        print_error "npm not found. Please install npm."
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "Prerequisites check failed. Please install missing requirements."
        exit 1
    fi
    
    print_success "All prerequisites met!"
    echo ""
}

# Setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    else
        print_warning "Virtual environment already exists, skipping..."
    fi
    
    # Activate virtual environment
    print_info "Activating virtual environment..."
    # shellcheck source=/dev/null
    source venv/bin/activate
    
    # Ensure pip exists (handles cases where ensurepip wasn't run)
    print_info "Ensuring pip is available..."
    python -m ensurepip --upgrade >/dev/null 2>&1
    
    # Upgrade pip
    print_info "Upgrading pip..."
    python -m pip install --upgrade pip --quiet
    
    # Install dependencies
    print_info "Installing Python dependencies..."
    python -m pip install -r requirements.txt --quiet
    print_success "Backend dependencies installed"
    
    # Deactivate virtual environment
    deactivate
    
    cd ..
    echo ""
}

# Setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    npm install --silent
    print_success "Frontend dependencies installed"
    
    cd ..
    echo ""
}

# Setup environment file
setup_env() {
    print_info "Setting up environment variables..."
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists. Skipping..."
        print_info "If you want to update it, edit .env manually or remove it and run this script again."
    else
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success ".env file created from .env.example"
            print_warning "⚠️  IMPORTANT: Please edit .env file and add your API keys:"
            echo "   - GROQ_API_KEY (get from https://console.groq.com/)"
            echo "   - VITE_AUTH0_DOMAIN (get from https://auth0.com/)"
            echo "   - VITE_AUTH0_CLIENT_ID (get from https://auth0.com/)"
        else
            print_error ".env.example not found. Cannot create .env file."
        fi
    fi
    
    echo ""
}

# Create uploads directory
create_directories() {
    print_info "Creating necessary directories..."
    
    mkdir -p backend/uploads
    mkdir -p uploads
    
    print_success "Directories created"
    echo ""
}

# Main setup function
main() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║      WazMind Setup Script              ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    
    # Get script directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    cd "$SCRIPT_DIR"
    
    # Run setup steps
    check_prerequisites
    setup_backend
    setup_frontend
    setup_env
    create_directories
    
    # Final instructions
    echo "╔════════════════════════════════════════╗"
    echo "║      Setup Complete! 🎉                ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    print_success "WazMind has been set up successfully!"
    echo ""
    print_info "Next steps:"
    echo ""
    echo "1. Edit .env file and add your API keys:"
    echo "   - GROQ_API_KEY"
    echo "   - VITE_AUTH0_DOMAIN"
    echo "   - VITE_AUTH0_CLIENT_ID"
    echo ""
    echo "2. Start the backend (Terminal 1):"
    echo "   cd backend"
    echo "   source venv/bin/activate"
    echo "   uvicorn app.main:app --reload --port 8000"
    echo ""
    echo "3. Start the frontend (Terminal 2):"
    echo "   cd frontend"
    echo "   npm run dev"
    echo ""
    echo "4. Access the application:"
    echo "   - Frontend: http://localhost:5173"
    echo "   - Backend API: http://localhost:8000"
    echo "   - API Docs: http://localhost:8000/docs"
    echo ""
    print_info "For detailed setup instructions, see:"
    echo "   - README.md"
    echo "   - QUICKSTART.md"
    echo "   - AUTH0_SETUP.md (for Auth0 configuration)"
    echo ""
}

# Run main function
main

