#!/bin/bash

# Flow Engine Documentation Deployment Script
# This script builds and deploys the documentation to GitHub Pages

set -e

echo "🌊 Flow Engine Documentation Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if docs directory exists
if [ ! -d "docs" ]; then
    print_error "docs directory not found. Please create the documentation first."
    exit 1
fi

print_status "Building documentation..."

# Create docs directory if it doesn't exist
mkdir -p docs

# Copy any additional assets
if [ -d "docs/assets" ]; then
    print_status "Copying assets..."
    cp -r docs/assets/* docs/ 2>/dev/null || true
fi

# Create a simple build process
print_status "Creating documentation build..."

# Check if we have the necessary files
if [ ! -f "docs/index.html" ]; then
    print_error "docs/index.html not found. Please create the documentation first."
    exit 1
fi

if [ ! -f "docs/styles.css" ]; then
    print_error "docs/styles.css not found. Please create the documentation first."
    exit 1
fi

if [ ! -f "docs/script.js" ]; then
    print_error "docs/script.js not found. Please create the documentation first."
    exit 1
fi

print_success "Documentation files found!"

# Create a simple index.html for GitHub Pages
print_status "Creating GitHub Pages index..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_warning "Not in a git repository. Initializing git..."
    git init
fi

# Add and commit changes
print_status "Adding documentation to git..."
git add docs/
git add .github/workflows/deploy.yml 2>/dev/null || true

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit."
else
    git commit -m "📚 Update documentation

    - Add comprehensive Flow Engine documentation
    - Include interactive features and animations
    - Add GitHub Pages deployment configuration
    - Include SEO optimization and meta tags
    - Add responsive design for mobile devices"
    
    print_success "Documentation committed to git!"
fi

# Push to GitHub (if remote exists)
if git remote get-url origin >/dev/null 2>&1; then
    print_status "Pushing to GitHub..."
    git push origin main
    
    print_success "Documentation pushed to GitHub!"
    print_status "GitHub Pages will automatically deploy the documentation."
    print_status "Check your repository settings to enable GitHub Pages."
else
    print_warning "No GitHub remote found. Please add a remote repository:"
    print_warning "git remote add origin https://github.com/yourusername/yourrepository.git"
fi

print_success "Documentation deployment completed!"
print_status "Your documentation will be available at:"
print_status "https://yourusername.github.io/yourrepository/"

echo ""
echo "🎉 Flow Engine Documentation is ready!"
echo "======================================"
echo ""
echo "📚 Documentation Features:"
echo "  • Beautiful responsive design"
echo "  • Interactive animations and effects"
echo "  • Live code examples"
echo "  • SEO optimized"
echo "  • Mobile friendly"
echo "  • Fast loading"
echo ""
echo "🚀 Next Steps:"
echo "  1. Enable GitHub Pages in your repository settings"
echo "  2. Set source to 'Deploy from a branch'"
echo "  3. Select 'main' branch and '/docs' folder"
echo "  4. Your site will be available at the URL above"
echo ""
echo "Happy coding! 🌊"
