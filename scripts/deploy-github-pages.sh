#!/bin/bash

# Flow Engine - GitHub Pages Deployment Script
# This script builds and deploys the documentation to GitHub Pages

set -e

echo "🌊 Flow Engine - GitHub Pages Deployment"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if docs directory exists
if [ ! -d "docs" ]; then
    echo "❌ Error: docs directory not found."
    exit 1
fi

echo "📦 Building the project..."
npm run build

echo "📝 Updating documentation..."
# The docs are already built, just need to ensure they're ready

echo "🚀 Deploying to GitHub Pages..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized."
    exit 1
fi

# Add all changes
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit."
else
    # Commit changes
    git commit -m "docs: update documentation for GitHub Pages deployment"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your documentation will be available at:"
echo "   https://prashantmishra.github.io/universal-workflow-generator"
echo ""
echo "📋 Next steps:"
echo "   1. Go to your GitHub repository settings"
echo "   2. Navigate to 'Pages' section"
echo "   3. Set source to 'Deploy from a branch'"
echo "   4. Select 'main' branch and '/docs' folder"
echo "   5. Save and wait for deployment to complete"
echo ""
echo "🎉 Happy coding!"
