# 🚀 Deployment Guide

This guide will help you deploy Flow Engine to GitHub Pages and publish it to NPM.

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository initialized
- GitHub account
- NPM account (for publishing)

## 🌐 GitHub Pages Deployment

### Step 1: Prepare Repository

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Add Remote Repository**:
   ```bash
   git remote add origin https://github.com/programsmagic/flow-engine.git
   ```

### Step 2: Deploy Documentation

1. **Run Deployment Script**:
   ```bash
   npm run docs:deploy
   ```

   This script will:
   - Build the project
   - Commit changes to git
   - Push to GitHub

2. **Configure GitHub Pages**:
   - Go to your GitHub repository
   - Click on "Settings" tab
   - Scroll down to "Pages" section
   - Set source to "Deploy from a branch"
   - Select "main" branch and "/docs" folder
   - Click "Save"

3. **Wait for Deployment**:
   - GitHub will automatically deploy your documentation
   - Your site will be available at: `https://programsmagic.github.io/flow-engine`

### Step 3: Verify Deployment

- Visit your GitHub Pages URL
- Check that all documentation is properly displayed
- Test the interactive features (code copying, tabs)

## 📦 NPM Publishing

### Step 1: Login to NPM

```bash
npm login
```

Enter your NPM username, password, and email when prompted.

### Step 2: Publish Package

```bash
npm run publish:npm
```

This script will:
- Ask for version bump type (patch/minor/major/custom)
- Update package.json version
- Clean and build the project
- Run tests (if available)
- Show dry-run preview
- Ask for confirmation before publishing
- Publish to NPM

### Step 3: Verify Publication

1. **Check NPM Package**:
   - Visit: `https://www.npmjs.com/package/flow-engine`
   - Verify package details and version

2. **Test Installation**:
   ```bash
   npm install flow-engine
   ```

## 🔧 Manual Deployment Steps

If you prefer to deploy manually:

### GitHub Pages Manual Deployment

1. **Build Documentation**:
   ```bash
   npm run build
   ```

2. **Commit and Push**:
   ```bash
   git add .
   git commit -m "Update documentation"
   git push origin main
   ```

3. **Configure GitHub Pages** (as described above)

### NPM Manual Publishing

1. **Update Version**:
   ```bash
   npm version patch  # or minor/major
   ```

2. **Build Project**:
   ```bash
   npm run build
   ```

3. **Publish**:
   ```bash
   npm publish
   ```

## 📝 Post-Deployment Checklist

### GitHub Pages
- [ ] Documentation loads correctly
- [ ] All code examples are syntax highlighted
- [ ] Interactive features work (tabs, copy buttons)
- [ ] Mobile responsiveness is good
- [ ] SEO meta tags are present

### NPM Package
- [ ] Package appears on NPM registry
- [ ] Installation works: `npm install flow-engine`
- [ ] Import works: `import { createFlow } from 'flow-engine'`
- [ ] CLI works: `npx flow-engine demo`
- [ ] Documentation links are correct

## 🐛 Troubleshooting

### GitHub Pages Issues

**Problem**: Site not loading
- **Solution**: Check GitHub Pages settings, ensure source is set to `/docs` folder

**Problem**: Documentation not updating
- **Solution**: Clear browser cache, check if deployment completed successfully

**Problem**: Code syntax highlighting not working
- **Solution**: Check browser console for JavaScript errors

### NPM Publishing Issues

**Problem**: "Not logged in" error
- **Solution**: Run `npm login` and authenticate

**Problem**: "Version already exists" error
- **Solution**: Use a different version number or bump version

**Problem**: "Package name taken" error
- **Solution**: Change package name in package.json or use scoped package

## 🔄 Updating Documentation

To update documentation after initial deployment:

1. **Make Changes**:
   - Edit files in `docs/` directory
   - Update README.md if needed

2. **Deploy**:
   ```bash
   npm run docs:deploy
   ```

3. **Verify**: Check GitHub Pages site for updates

## 📈 Updating NPM Package

To publish updates to NPM:

1. **Make Code Changes**:
   - Update source code
   - Update version in package.json
   - Update documentation

2. **Publish**:
   ```bash
   npm run publish:npm
   ```

3. **Verify**: Check NPM package page and test installation

## 🎯 Best Practices

### Documentation
- Keep examples up-to-date with latest API
- Test all code examples before publishing
- Use clear, concise language
- Include interactive elements for better UX

### NPM Package
- Follow semantic versioning (semver)
- Write comprehensive changelog
- Test package installation in clean environment
- Keep dependencies minimal

### Git Workflow
- Use descriptive commit messages
- Tag releases for important versions
- Keep main branch stable
- Use feature branches for development

## 📞 Support

If you encounter issues:

1. **Check Documentation**: Review this guide thoroughly
2. **Check Logs**: Look for error messages in terminal output
3. **GitHub Issues**: Create an issue in the repository
4. **NPM Support**: Contact NPM support for package-related issues

---

**Happy Deploying! 🚀**
