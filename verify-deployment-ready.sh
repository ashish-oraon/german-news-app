#!/bin/bash

# 🔍 German News App - Deployment Readiness Checker
# This script verifies your app is ready for GitHub Pages deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
ROCKET="🚀"

echo -e "${BLUE}${ROCKET} German News App - Deployment Readiness Check${NC}"
echo "======================================================"
echo

# Function to print colored messages
print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "angular.json" ]; then
    print_error "This script must be run from the root of your Angular project"
    exit 1
fi

print_success "Found Angular project!"
echo

# Check required files
print_info "Checking required files..."
required_files=(
    "package.json"
    "angular.json"
    "src/environments/environment.ts"
    "src/environments/environment.prod.ts"
    ".github/workflows/deploy.yml"
    "README.md"
    "SECURITY.md"
    ".gitignore"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found $file"
    else
        print_error "Missing $file"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    print_error "Some required files are missing!"
    exit 1
fi

echo

# Check environment configuration
print_info "Checking environment configuration..."

# Check development environment
if grep -q "production: false" src/environments/environment.ts; then
    print_success "Development environment correctly configured"
else
    print_error "Development environment should have production: false"
fi

# Check production environment
if grep -q "production: true" src/environments/environment.prod.ts; then
    print_success "Production environment correctly configured"
else
    print_error "Production environment should have production: true"
fi

# Check if production uses environment variables
if grep -q "process.env\['RSS2JSON_API_KEY'\]" src/environments/environment.prod.ts; then
    print_success "Production environment uses GitHub Secrets"
else
    print_error "Production environment should use process.env for API keys"
fi

echo

# Check for API key placeholders
print_info "Checking API key configuration..."

if grep -q "YOUR_RSS2JSON_API_KEY_HERE" src/environments/environment.ts; then
    print_warning "Development environment still has placeholder RSS2JSON API key"
    print_info "Update src/environments/environment.ts with your real API key for local testing"
else
    print_success "Development environment has API key configured"
fi

echo

# Check package.json scripts
print_info "Checking package.json scripts..."

required_scripts=("build:prod" "build:github" "start")
for script in "${required_scripts[@]}"; do
    if grep -q "\"$script\":" package.json; then
        print_success "Found npm script: $script"
    else
        print_error "Missing npm script: $script"
    fi
done

echo

# Test build
print_info "Testing production build..."
if npm run build:prod > /dev/null 2>&1; then
    print_success "Production build successful!"
else
    print_error "Production build failed!"
    print_info "Run 'npm run build:prod' to see detailed errors"
fi

echo

# Check Git status
print_info "Checking Git repository status..."

if [ -d ".git" ]; then
    print_success "Git repository initialized"

    # Check if there are uncommitted changes
    if git diff --quiet && git diff --staged --quiet; then
        print_success "No uncommitted changes"
    else
        print_warning "You have uncommitted changes"
        print_info "Run 'git status' to see changes"
    fi

    # Check if remote exists
    if git remote | grep -q "origin"; then
        remote_url=$(git remote get-url origin)
        print_success "Git remote configured: $remote_url"
    else
        print_warning "No Git remote configured"
        print_info "You'll need to add GitHub remote: git remote add origin <your-repo-url>"
    fi
else
    print_error "Git repository not initialized"
    print_info "Run 'git init' to initialize Git repository"
fi

echo

# Summary
print_info "Deployment Readiness Summary:"
echo "============================================"

# Check overall readiness
overall_ready=true

if [ ! -f ".github/workflows/deploy.yml" ]; then
    overall_ready=false
fi

if ! grep -q "production: false" src/environments/environment.ts; then
    overall_ready=false
fi

if ! grep -q "production: true" src/environments/environment.prod.ts; then
    overall_ready=false
fi

if [ "$overall_ready" = true ]; then
    print_success "Your app is ready for GitHub Pages deployment!"
    echo
    print_info "Next Steps:"
    echo "1. Get your RSS2JSON API key from https://rss2json.com/"
    echo "2. Update src/environments/environment.ts with your real API key"
    echo "3. Create GitHub repository"
    echo "4. Add GitHub Secrets (RSS2JSON_API_KEY)"
    echo "5. Enable GitHub Pages with 'GitHub Actions' source"
    echo "6. Push your code to deploy!"
    echo
    print_info "📖 See CLEAN_DEPLOYMENT_GUIDE.md for detailed steps"
else
    print_error "Your app needs some fixes before deployment"
    print_info "Please address the issues above and run this script again"
fi

echo
print_info "🚀 Happy deploying!"
