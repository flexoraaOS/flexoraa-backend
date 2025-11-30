#!/bin/bash

# Flexoraa Production Setup Script
# This script helps automate the production setup process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${MAGENTA}"
    echo "============================================================"
    echo "  $1"
    echo "============================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    else
        print_success "$1 is installed"
        return 0
    fi
}

# Main script
print_header "FLEXORAA PRODUCTION SETUP"

# Step 1: Check prerequisites
print_info "Step 1: Checking prerequisites..."
echo ""

MISSING_DEPS=0

if ! check_command "node"; then
    print_error "Please install Node.js (v18 or higher)"
    MISSING_DEPS=1
fi

if ! check_command "npm"; then
    print_error "Please install npm"
    MISSING_DEPS=1
fi

if ! check_command "git"; then
    print_error "Please install git"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Missing required dependencies. Please install them first."
    exit 1
fi

echo ""

# Step 2: Check if we're in the right directory
print_info "Step 2: Checking directory structure..."
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi
print_success "Correct directory"
echo ""

# Step 3: Create .env.local if it doesn't exist
print_info "Step 3: Setting up environment file..."
if [ ! -f ".env.local" ]; then
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.local
        print_success "Created .env.local from example"
        print_warning "Please edit .env.local and fill in all required values"
    else
        print_error ".env.production.example not found"
        exit 1
    fi
else
    print_info ".env.local already exists"
fi
echo ""

# Step 4: Install dependencies
print_info "Step 4: Installing dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi
cd ..
echo ""

# Step 5: Verify environment configuration
print_info "Step 5: Verifying environment configuration..."
cd frontend
node ../scripts/verify-production-setup.js
VERIFY_EXIT_CODE=$?
cd ..

if [ $VERIFY_EXIT_CODE -eq 0 ]; then
    print_success "Environment configuration verified"
else
    print_warning "Environment configuration needs attention"
    echo ""
    print_info "Please update .env.local with correct values and run again"
    exit 1
fi
echo ""

# Step 6: Build test
print_info "Step 6: Testing production build..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    print_success "Build successful"
else
    print_error "Build failed. Please fix errors and try again."
    exit 1
fi
cd ..
echo ""

# Step 7: Final instructions
print_header "SETUP COMPLETE! 🎉"
echo ""
print_info "Next Steps:"
echo ""
echo "1. 📊 Database Setup:"
echo "   - Go to Supabase SQL Editor"
echo "   - Run PRODUCTION_SETUP_COMPLETE.sql"
echo ""
echo "2. 🔌 Meta/Facebook Setup:"
echo "   - Create Meta Developer App"
echo "   - Configure WhatsApp, Instagram, Messenger"
echo "   - Set up webhooks"
echo ""
echo "3. 🤖 N8N Workflows:"
echo "   - Deploy n8n instance"
echo "   - Import workflows from echo123-workflows/"
echo "   - Update webhook URLs in .env.local"
echo ""
echo "4. 🚀 Deploy:"
echo "   - Push code to Git"
echo "   - Deploy to Vercel"
echo "   - Add environment variables in Vercel"
echo ""
echo "📚 Refer to PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
print_success "Setup script completed successfully!"
