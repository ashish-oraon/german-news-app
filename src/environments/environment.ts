export const environment = {
  production: false,

  // 🔑 API Configuration - Add your real API keys here for local development
  rss2JsonApiKey: '8rbktxazq9pwkhrtxrg1nfobod3pqdbdvojlfmnq', // Replace with your RSS2JSON API key
  deeplApiKey: '9953d415-eee9-40c8-9ff8-d2f17b63d5a4:fx',       // Replace with your DeepL API key (optional)

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

  // ⚡ Cache Configuration
  cacheTimeout: 15 * 60 * 1000,          // 15 minutes
  translationCacheTimeout: 60 * 60 * 1000 // 1 hour
};
