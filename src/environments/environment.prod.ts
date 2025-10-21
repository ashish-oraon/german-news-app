export const environment = {
  production: true,

  // 🔑 API Configuration - Uses GitHub Secrets in production
  rss2JsonApiKey: process.env['RSS2JSON_API_KEY'] || '',
  deeplApiKey: process.env['DEEPL_API_KEY'] || '',

  // 🌐 API URLs
  deeplApiUrl: 'https://api-free.deepl.com/v2/translate',
  rss2JsonBaseUrl: 'https://api.rss2json.com/v1/api.json',

  // 🔒 Security Configuration
  enableSecurityHeaders: true,
  allowedOrigins: [
    'https://*.github.io',
    'https://github.com'
  ],

  // 🎛️ Feature Flags
  enableMockTranslations: true,  // Allow fallback translations in production
  enableAnalytics: false,       // Privacy-focused - no tracking

  // ⚡ Cache Configuration
  cacheTimeout: 15 * 60 * 1000,          // 15 minutes
  translationCacheTimeout: 60 * 60 * 1000 // 1 hour
};
