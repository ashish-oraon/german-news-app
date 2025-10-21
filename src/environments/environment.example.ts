/**
 * Example Environment Configuration
 *
 * Copy this file to environment.local.ts and add your actual API keys
 * Never commit environment.local.ts to version control!
 */

export const environment = {
  production: false,

  // 🔑 API Configuration
  // Get your RSS2JSON API key from: https://rss2json.com/
  rss2JsonApiKey: 'your_rss2json_api_key_here',

  // Get your DeepL API key from: https://www.deepl.com/pro-api (Optional)
  deeplApiKey: 'your_deepl_api_key_here',

  // 🌐 API URLs
  deeplApiUrl: 'https://api-free.deepl.com/v2/translate',
  rss2JsonBaseUrl: 'https://api.rss2json.com/v1/api.json',

  // 🔒 Security Configuration
  enableSecurityHeaders: true,
  allowedOrigins: [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://127.0.0.1:4200'
  ],

  // 🎛️ Feature Flags
  enableMockTranslations: true,  // Use mock translations when DeepL is unavailable
  enableAnalytics: false,        // Disable analytics in development
  enableServiceWorker: false,    // Disable PWA features in development

  // ⚡ Cache Configuration
  cacheTimeout: 15 * 60 * 1000,          // 15 minutes for RSS cache
  translationCacheTimeout: 60 * 60 * 1000, // 1 hour for translation cache

  // 📊 Performance Settings
  maxArticlesPerSource: 15,       // Maximum articles to fetch per source
  maxTotalArticles: 100,         // Maximum total articles in cache
  translationBatchSize: 5,       // Articles to translate simultaneously

  // 🎨 UI Configuration
  defaultTheme: 'auto',          // 'light', 'dark', or 'auto'
  enableAnimations: true,        // Enable UI animations
  compactMode: false,           // Compact layout for smaller screens

  // 🔧 Development Settings
  debugMode: true,              // Enable debug logging
  mockDataEnabled: false,       // Use mock data instead of real APIs
  apiTimeout: 10000,           // API timeout in milliseconds

  // 📱 PWA Configuration
  swUpdateCheckInterval: 6 * 60 * 60 * 1000, // Check for updates every 6 hours
  offlineStorageQuota: 50 * 1024 * 1024,     // 50MB offline storage limit

  // 🌍 Localization
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'de'],
  dateFormat: 'medium',          // Angular date pipe format

  // 🔒 Rate Limiting
  apiRateLimit: 1000,           // Minimum milliseconds between API calls
  translationRateLimit: 2000,   // Minimum milliseconds between translations
  searchRateLimit: 500,         // Minimum milliseconds between searches
};
