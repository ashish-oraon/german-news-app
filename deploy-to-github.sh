#!/bin/bash

# 🚀 German News App - GitHub Deployment Script
# This script helps you deploy your Angular app to GitHub Pages quickly and securely

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis for better UX
CHECK="✅"
CROSS="❌"
INFO="ℹ️"
ROCKET="🚀"
WARNING="⚠️"

echo -e "${BLUE}${ROCKET} German News App - GitHub Deployment Setup${NC}"
echo "=================================================="
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
    echo "Please navigate to your project directory and run this script again"
    exit 1
fi

print_success "Found Angular project!"

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_info "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
fi

# Check for required files
echo
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

missing_files=()
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found $file"
    else
        missing_files+=("$file")
        print_error "Missing $file"
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    print_error "Some required files are missing. Please ensure all files are present."
    exit 1
fi

# Check for API keys in environment files
echo
print_info "Checking environment configuration..."

if grep -q "YOUR_.*_API_KEY_HERE" src/environments/environment.ts; then
    print_warning "Environment file still contains placeholder API keys"
    echo "Please update src/environments/environment.ts with your actual API keys"
    echo "Or copy src/environments/environment.example.ts to environment.local.ts"
fi

if grep -q "YOUR_.*_API_KEY_HERE" src/environments/environment.prod.ts; then
    print_success "Production environment correctly configured for GitHub secrets"
else
    print_warning "Production environment may not be configured for GitHub deployment"
fi

# Get GitHub username
echo
read -p "Enter your GitHub username: " github_username

if [ -z "$github_username" ]; then
    print_error "GitHub username is required"
    exit 1
fi

# Update README with GitHub username
print_info "Updating README with your GitHub username..."
sed -i.bak "s/YOUR_USERNAME/$github_username/g" README.md
rm README.md.bak 2>/dev/null || true
print_success "README updated with GitHub username: $github_username"

# Check if package.json has GitHub deployment scripts
if ! grep -q "build:github" package.json; then
    print_error "GitHub deployment scripts missing from package.json"
    print_info "Please ensure your package.json includes:"
    echo '  "build:github": "ng build --configuration production --base-href '/german-news-app/'"'
    exit 1
fi

print_success "Package.json has required scripts"

# Create commit
echo
print_info "Preparing files for commit..."

# Add all files to git
git add .

# Check git status
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    echo
    print_info "Files ready for commit:"
    git diff --staged --name-only | sed 's/^/  - /'
    echo

    read -p "Create commit with these changes? (y/N): " create_commit

    if [[ $create_commit =~ ^[Yy]$ ]]; then
        print_info "Creating commit..."
        git commit -m "🚀 Deploy German News App to GitHub Pages

Features implemented:
- Enterprise-grade security with API key protection
- Automated CI/CD pipeline with GitHub Actions
- PWA capabilities with offline support
- Real German news aggregation with English translation
- Modern Angular 18 with Material Design 3
- Comprehensive security auditing and monitoring
- Mobile-responsive design with dark/light themes

Ready for deployment at: https://$github_username.github.io/german-news-app/"

        print_success "Commit created successfully!"
    else
        print_info "Skipping commit creation"
    fi
fi

# Repository setup instructions
echo
echo "=========================================="
print_info "Next Steps for GitHub Deployment:"
echo "=========================================="
echo
print_info "1. Create GitHub Repository:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: german-news-app"
echo "   - Make it public (required for free GitHub Pages)"
echo "   - Don't initialize with README (we have our own)"
echo
print_info "2. Add Remote and Push:"
echo "   git remote add origin https://github.com/$github_username/german-news-app.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo
print_info "3. Configure GitHub Secrets:"
echo "   - Go to: https://github.com/$github_username/german-news-app/settings/secrets/actions"
echo "   - Add secret: RSS2JSON_API_KEY (your RSS2JSON API key)"
echo "   - Add secret: DEEPL_API_KEY (your DeepL API key - optional)"
echo
print_info "4. Enable GitHub Pages:"
echo "   - Go to: https://github.com/$github_username/german-news-app/settings/pages"
echo "   - Source: GitHub Actions"
echo "   - Save"
echo
print_info "5. Your app will be live at:"
echo "   ${GREEN}https://$github_username.github.io/german-news-app/${NC}"
echo

print_success "Setup completed! Follow the steps above to deploy your app."

# Security reminder
echo
print_warning "Security Reminder:"
echo "- Never commit API keys to your repository"
echo "- Use GitHub Secrets for production API keys"
echo "- The environment.ts file should use placeholder keys only"
echo "- Real keys should be in environment.local.ts (gitignored) or GitHub Secrets"
echo

# Quick commands summary
echo "📋 Quick Commands Summary:"
echo "========================="
echo "Deploy to GitHub:"
echo "  git remote add origin https://github.com/$github_username/german-news-app.git"
echo "  git push -u origin main"
echo
echo "Local development:"
echo "  npm install"
echo "  npm start"
echo
echo "Build for production:"
echo "  npm run build:prod"
echo

print_success "German News App is ready for GitHub deployment! ${ROCKET}"
