# 🔑 Secure API Setup Instructions

## Overview

This guide helps you securely configure API keys for the German News App without exposing them in source code.

## 🚨 IMPORTANT: Security First

**Never commit API keys to source code!** This application now uses environment variables to keep your keys secure.

## 🛠️ Setup Instructions

### Step 1: Configure Development Environment

1. **Edit Development Environment File:**
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     production: false,
     rss2JsonApiKey: 'your_rss2json_api_key_here',    // Replace with your key
     deeplApiKey: 'your_deepl_api_key_here',          // Replace with your key
     // ... other settings
   };
   ```

2. **Get Your API Keys:**

   **RSS2JSON API:**
   - Visit: https://rss2json.com/
   - Sign up for free account
   - Copy your API key
   - Free tier: 10,000 requests/day

   **DeepL API (Optional but Recommended):**
   - Visit: https://www.deepl.com/pro-api
   - Sign up for free account
   - Copy your API key
   - Free tier: 500,000 characters/month

### Step 2: Configure Production Environment

1. **Set Environment Variables on Server:**
   ```bash
   export RSS2JSON_API_KEY="your_actual_rss2json_key"
   export DEEPL_API_KEY="your_actual_deepl_key"
   ```

2. **Production Environment File:**
   ```typescript
   // src/environments/environment.prod.ts
   export const environment = {
     production: true,
     rss2JsonApiKey: process.env['RSS2JSON_API_KEY'] || '',
     deeplApiKey: process.env['DEEPL_API_KEY'] || '',
     // ... other settings
   };
   ```

### Step 3: Verify Configuration

1. **Check API Key Validation:**
   The app will show warnings if keys are not configured:
   ```
   ⚠️ Translation service API keys not configured. Using fallback translations.
   ```

2. **Test API Connections:**
   - RSS feeds should load successfully
   - Translation should work (if DeepL key provided)
   - Check browser console for any API errors

## 🔄 Migration from Old Setup

If you were using the old hardcoded API keys:

1. **Remove Old Keys from Code** ✅ (Already done)
2. **Add Keys to Environment Files** (Follow steps above)
3. **Rebuild Application:**
   ```bash
   npm run build --configuration=production
   ```

## 🎯 API Key Features

### RSS2JSON API Key Benefits:
- **10,000 requests/day** (vs 100 without key)
- **Faster response times**
- **More reliable service**
- **Better rate limiting**

### DeepL API Key Benefits:
- **Professional translation quality**
- **500,000 characters/month free**
- **Context-aware translations**
- **Technical terminology recognition**

## 🚫 Fallback Behavior

**Without API Keys:**
- RSS feeds: Limited to 100 requests/day (RSS2JSON free tier)
- Translation: Uses intelligent mock translation with German word dictionary

**With API Keys:**
- RSS feeds: 10,000 requests/day with better reliability
- Translation: Professional DeepL translations with MyMemory fallback

## 🔒 Security Features

✅ **Environment Variables:** Keys stored securely outside source code  
✅ **Input Validation:** All API responses are sanitized  
✅ **Rate Limiting:** Prevents API abuse  
✅ **Error Handling:** Graceful fallbacks if APIs fail  
✅ **CORS Protection:** Only approved external APIs allowed  

## 🛠️ Development Commands

```bash
# Development (with environment keys)
npm run dev

# Production build (uses environment variables)
npm run build --configuration=production

# Check for security issues
npm audit
```

## 🆘 Troubleshooting

### Common Issues:

1. **"API key not configured" warning:**
   - Check environment file has correct key names
   - Ensure keys are not empty strings
   - Verify no extra spaces in key values

2. **RSS feeds not loading:**
   - Verify RSS2JSON API key is valid
   - Check network connection
   - Review browser console for errors

3. **Translation not working:**
   - Verify DeepL API key is valid
   - Check if free tier limit exceeded
   - Fallback translation should still work

4. **Production deployment issues:**
   - Ensure environment variables are set on server
   - Check server logs for configuration errors
   - Verify build was done with production configuration

### Debug Commands:

```bash
# Check environment configuration
echo $RSS2JSON_API_KEY
echo $DEEPL_API_KEY

# Test API connectivity
curl "https://api.rss2json.com/v1/api.json?api_key=YOUR_KEY&rss_url=https://feeds.bbc.co.uk/news/rss.xml"
```

## 📋 Security Checklist

Before deploying to production:

- [ ] API keys removed from source code
- [ ] Environment variables set on production server
- [ ] Production build completed successfully
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] No source maps in production build
- [ ] Error logging configured (without exposing keys)

## 🚀 Next Steps

After setup:
1. Monitor API usage in respective dashboards
2. Set up alerts for API quota limits
3. Regularly rotate API keys (quarterly recommended)
4. Keep dependencies updated for security

---

**🎉 Enjoy secure, professional German news with English translations!**
