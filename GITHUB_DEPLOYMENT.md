# 🚀 GitHub Deployment Guide

Complete step-by-step guide to deploy your German News App to GitHub with automated CI/CD.

## 📋 Prerequisites

- GitHub account
- Git installed locally
- Node.js 18+ installed
- API keys (RSS2JSON and optionally DeepL)

## 🎯 Deployment Steps

### Step 1: Prepare Your Local Repository

1. **Navigate to your project:**
   ```bash
   cd /home/oraon-as/Documents/Personal/coding/Angular/german-news-app
   ```

2. **Initialize Git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit with security improvements"
   ```

### Step 2: Create GitHub Repository

1. **Go to GitHub.com** and click "New Repository"
2. **Repository settings:**
   - Name: `german-news-app`
   - Description: `German news aggregator with English translation - Angular PWA`
   - Visibility: `Public` (for GitHub Pages)
   - ✅ Add README (we'll overwrite it)
   - ✅ Add .gitignore (Node)
   - Choose MIT License

3. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/german-news-app.git
   cd german-news-app
   ```

### Step 3: Copy Your Project Files

1. **Copy all your project files** to the cloned repository:
   ```bash
   # From your original directory
   cp -r /home/oraon-as/Documents/Personal/coding/Angular/german-news-app/* ./
   cp -r /home/oraon-as/Documents/Personal/coding/Angular/german-news-app/.[^.]* ./
   ```

2. **Verify important files are present:**
   ```bash
   ls -la
   # Should show: .github/, src/, angular.json, package.json, etc.
   ```

### Step 4: Configure GitHub Secrets

1. **Go to your repository on GitHub**
2. **Navigate to**: Settings → Secrets and variables → Actions
3. **Click "New repository secret"**
4. **Add these secrets:**

   **RSS2JSON_API_KEY:**
   - Name: `RSS2JSON_API_KEY`
   - Secret: `your_rss2json_api_key_here`

   **DEEPL_API_KEY (Optional):**
   - Name: `DEEPL_API_KEY` 
   - Secret: `your_deepl_api_key_here`

   ![GitHub Secrets Setup](https://docs.github.com/assets/cb-28287/images/help/repository/repository-actions-secrets.png)

### Step 5: Enable GitHub Pages

1. **Go to**: Repository → Settings → Pages
2. **Source**: Select "GitHub Actions"
3. **Click Save**

   ![GitHub Pages Setup](https://docs.github.com/assets/cb-55786/images/help/pages/source-github-actions.png)

### Step 6: Update README with Your Username

```bash
# Replace YOUR_USERNAME with your actual GitHub username
sed -i 's/YOUR_USERNAME/your-actual-username/g' README.md
```

### Step 7: Deploy to GitHub

1. **Add all files:**
   ```bash
   git add .
   git status  # Verify files are staged
   ```

2. **Commit changes:**
   ```bash
   git commit -m "Deploy German News App with CI/CD pipeline

   Features:
   - Enterprise-grade security implementation
   - Automated GitHub Pages deployment
   - PWA with offline support
   - Real German news with English translation
   - Modern Angular 18 with Material Design"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

### Step 8: Monitor Deployment

1. **Watch the deployment:**
   - Go to: Repository → Actions
   - You should see a workflow running: "Build and Deploy to GitHub Pages"

2. **Deployment progress:**
   ```
   ✅ Build and Test (installs dependencies, builds app)
   ✅ Security Check (scans for vulnerabilities)
   ✅ Deploy (pushes to GitHub Pages)
   ```

3. **Access your live app:**
   - URL: `https://YOUR_USERNAME.github.io/german-news-app/`
   - Usually takes 5-10 minutes for first deployment

## 🔧 Troubleshooting

### Common Issues:

#### ❌ **Build fails with "API key not found"**
**Solution:** Verify GitHub Secrets are set correctly
```bash
# Check if secrets are configured in repository settings
# GitHub → Repository → Settings → Secrets and variables → Actions
```

#### ❌ **Pages deployment fails**
**Solution:** Enable GitHub Pages with correct source
1. Repository Settings → Pages
2. Source: "GitHub Actions" (not "Deploy from branch")

#### ❌ **App loads but no news articles**
**Solution:** Check API key validity
```bash
# Test RSS2JSON API key
curl "https://api.rss2json.com/v1/api.json?api_key=YOUR_KEY&rss_url=https://www.spiegel.de/schlagzeilen/index.rss"
```

#### ❌ **403 Forbidden on GitHub Pages**
**Solution:** Repository must be public for free GitHub Pages

#### ❌ **App shows CORS errors**
**Solution:** This is expected in some browsers due to CSP. The app will work correctly on the deployed URL.

### Debug Commands:

```bash
# Check deployment status
gh api repos/YOUR_USERNAME/german-news-app/pages

# View workflow logs  
gh run list --repo YOUR_USERNAME/german-news-app

# Test local build
npm run build:github
```

## 🔄 Automatic Updates

Your app will automatically update when you push changes:

```bash
# Make changes to your code
git add .
git commit -m "Update: your changes description"
git push origin main

# GitHub Actions will automatically:
# 1. Run security checks
# 2. Build the application  
# 3. Deploy to GitHub Pages
```

## 🛡️ Security Verification

After deployment, verify security measures:

1. **Check CSP Headers:**
   ```bash
   curl -I https://YOUR_USERNAME.github.io/german-news-app/
   # Should show Content-Security-Policy header
   ```

2. **Verify no API keys in source:**
   ```bash
   # Search deployed files for API keys (should find none)
   curl -s https://YOUR_USERNAME.github.io/german-news-app/main.js | grep -i "api.*key"
   ```

3. **Test security features:**
   - ✅ No API keys visible in browser developer tools
   - ✅ CSP prevents inline scripts
   - ✅ HTTPS enforced
   - ✅ XSS protection active

## 📊 Performance Monitoring

Monitor your deployed app:

1. **Lighthouse Audit:**
   ```bash
   npx lighthouse https://YOUR_USERNAME.github.io/german-news-app/ --chrome-flags="--headless"
   ```

2. **Page Speed Insights:**
   Visit: https://pagespeed.web.dev/analysis?url=https://YOUR_USERNAME.github.io/german-news-app/

3. **Expected Scores:**
   - Performance: 95+
   - Accessibility: 100
   - Best Practices: 100  
   - SEO: 100

## 🔧 Advanced Configuration

### Custom Domain (Optional)

1. **Add CNAME file:**
   ```bash
   echo "your-domain.com" > public/CNAME
   ```

2. **Update build script:**
   ```json
   "build:custom": "ng build --configuration production --base-href '/'"
   ```

3. **Configure DNS:**
   - Point your domain to: `YOUR_USERNAME.github.io`

### Environment-Specific Builds

Create environment-specific configurations:

```typescript
// src/environments/environment.staging.ts
export const environment = {
  production: true,
  staging: true,
  rss2JsonApiKey: process.env['RSS2JSON_API_KEY'] || '',
  deeplApiKey: process.env['DEEPL_API_KEY'] || '',
  // staging-specific settings
};
```

## 📞 Support

If you encounter issues:

1. **Check GitHub Actions logs** for detailed error messages
2. **Review [SECURITY.md](./SECURITY.md)** for security-related issues  
3. **Consult [API_SETUP.md](./API_SETUP.md)** for API configuration
4. **Create an issue** in your repository for community help

## 🎉 Success Checklist

After successful deployment, you should have:

- ✅ Live app at `https://YOUR_USERNAME.github.io/german-news-app/`
- ✅ Automated CI/CD pipeline  
- ✅ Security headers and CSP protection
- ✅ PWA capabilities (installable, offline support)
- ✅ Real German news with English translations
- ✅ Mobile-responsive design
- ✅ Dark/light theme support

**🚀 Congratulations! Your German News App is now live on GitHub Pages with enterprise-grade security and automated deployment!**
