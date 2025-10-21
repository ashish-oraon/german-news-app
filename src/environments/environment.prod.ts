export const environment = {
  production: true,
  
  // 🔑 API Configuration - Will be replaced during build with actual values from GitHub Secrets
  // DO NOT put real API keys here - they will be injected by scripts/generate-env.js during CI/CD
  rss2JsonApiKey: 'PLACEHOLDER_RSS2JSON_KEY',
  deeplApiKey: 'PLACEHOLDER_DEEPL_KEY',
  
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
