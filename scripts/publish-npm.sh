#!/bin/bash

# Flow Engine - NPM Publishing Script
# This script prepares and publishes the package to NPM

set -e

echo "🌊 Flow Engine - NPM Publishing"
echo "==============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if user is logged into NPM
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Error: Not logged into NPM. Please run 'npm login' first."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Ask for version bump type
echo ""
echo "What type of version bump would you like?"
echo "1) patch (1.0.0 -> 1.0.1)"
echo "2) minor (1.0.0 -> 1.1.0)"
echo "3) major (1.0.0 -> 2.0.0)"
echo "4) custom"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        npm version patch
        ;;
    2)
        npm version minor
        ;;
    3)
        npm version major
        ;;
    4)
        read -p "Enter custom version: " custom_version
        npm version $custom_version
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

NEW_VERSION=$(node -p "require('./package.json').version")
echo "📦 New version: $NEW_VERSION"

# Clean and build
echo ""
echo "🧹 Cleaning previous build..."
npm run clean

echo "🔨 Building the project..."
npm run build

# Run tests (if available)
if npm run test > /dev/null 2>&1; then
    echo "🧪 Running tests..."
    npm run test
else
    echo "ℹ️  No tests found, skipping..."
fi

# Check if package is already published
PACKAGE_NAME=$(node -p "require('./package.json').name")
if npm view $PACKAGE_NAME version > /dev/null 2>&1; then
    PUBLISHED_VERSION=$(npm view $PACKAGE_NAME version)
    echo "📦 Published version: $PUBLISHED_VERSION"
    
    if [ "$NEW_VERSION" = "$PUBLISHED_VERSION" ]; then
        echo "❌ Error: Version $NEW_VERSION is already published."
        exit 1
    fi
fi

# Dry run to check what will be published
echo ""
echo "🔍 Checking what will be published..."
npm publish --dry-run

echo ""
read -p "🤔 Do you want to proceed with publishing? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Publishing to NPM..."
    npm publish
    
    echo ""
    echo "✅ Successfully published $PACKAGE_NAME@$NEW_VERSION to NPM!"
    echo ""
    echo "🌐 Package URL: https://www.npmjs.com/package/$PACKAGE_NAME"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Update your documentation with the new version"
    echo "   2. Create a GitHub release for version $NEW_VERSION"
    echo "   3. Update any dependent projects"
    echo ""
    echo "🎉 Happy publishing!"
else
    echo "❌ Publishing cancelled."
    exit 1
fi
