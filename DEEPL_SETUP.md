# DeepL API Integration Setup

## 🔑 Adding Your DeepL API Key

### Step 1: Get Your DeepL API Key
1. Sign up at [DeepL API](https://www.deepl.com/pro-api)
2. Get your **Authentication Key** from the account dashboard
3. Note: Free tier includes 500,000 characters/month

### Step 2: Add Key to Translation Service

Open `src/app/services/translation.service.ts` and replace:

```typescript
private readonly DEEPL_API_KEY = 'YOUR_DEEPL_API_KEY_HERE';
```

With your actual key:

```typescript
private readonly DEEPL_API_KEY = 'your-actual-deepl-key-12345:fx';
```

### Step 3: Choose API Endpoint

**For Free Accounts:**
```typescript
private readonly DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
```

**For Pro Accounts:**
```typescript
private readonly DEEPL_API_URL = 'https://api.deepl.com/v2/translate';
```

## 🚀 Features You'll Get

✅ **Professional German → English Translation**  
✅ **Context-Aware Translations**  
✅ **Technical Term Recognition**  
✅ **News Industry Terminology**  
✅ **Automatic Fallback** to enhanced mock if API fails  
✅ **Translation Caching** for performance  
✅ **Rate Limit Management**  

## 📊 Translation Quality Comparison

| Service | German News Quality | Speed | Cost |
|---------|-------------------|-------|------|
| **DeepL** | ⭐⭐⭐⭐⭐ Excellent | Fast | €5.49/month |
| Enhanced Mock | ⭐⭐⭐ Good | Instant | Free |
| Google Translate | ⭐⭐⭐⭐ Very Good | Fast | $20/1M chars |

## 🔒 Security Best Practices

**Option 1: Environment Variables (Recommended)**
```typescript
private readonly DEEPL_API_KEY = environment.deeplApiKey;
```

**Option 2: Angular Environment Files**
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  deeplApiKey: 'your-key-here'
};
```

## 🛠 Testing Translation

After adding your key, the app will automatically:
1. Fetch real German news from RSS feeds
2. Translate titles and content via DeepL API
3. Show translation badges and status
4. Cache translations for better performance

## 📈 Usage Monitoring

Monitor your API usage at: https://www.deepl.com/account/usage

## 🔧 Troubleshooting

**403 Forbidden:** Check your API key is correct  
**456 Quota Exceeded:** Upgrade plan or wait for reset  
**Too Many Requests:** Built-in rate limiting will handle this  

## 💡 Pro Tips

- DeepL excels at German business/political news translation
- Free tier is perfect for development and personal use
- Pro tier needed for commercial applications
- Translation quality improves with longer text context
