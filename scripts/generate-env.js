#!/usr/bin/env node

/**
 * Generate environment.prod.ts with actual API keys from environment variables
 * This script runs during GitHub Actions build to inject secrets into the production build
 */

const fs = require('fs');
const path = require('path');

// Get environment variables from GitHub Actions
const rss2JsonApiKey = process.env.RSS2JSON_API_KEY || '';
const deeplApiKey = process.env.DEEPL_API_KEY || '';

// Validate required environment variables
if (!rss2JsonApiKey) {
  console.warn('⚠️ RSS2JSON_API_KEY not found in environment variables');
  console.log('The app will use fallback behavior for RSS feeds');
}

if (!deeplApiKey) {
  console.log('ℹ️ DEEPL_API_KEY not found - using fallback translations (this is optional)');
}

// Generate production environment file with actual values
const environmentContent = `export const environment = {
  production: true,

  // 🔑 API Configuration - Injected during build from GitHub Secrets
  rss2JsonApiKey: '${rss2JsonApiKey}',
  deeplApiKey: '${deeplApiKey}',

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
`;

// Write the generated environment file
const envPath = path.join(__dirname, '../src/environments/environment.prod.ts');
fs.writeFileSync(envPath, environmentContent);

console.log('✅ Generated production environment file with injected API keys');
console.log(`📍 RSS2JSON API Key: ${rss2JsonApiKey ? 'SET ✓' : 'NOT SET ✗'}`);
console.log(`📍 DeepL API Key: ${deeplApiKey ? 'SET ✓' : 'NOT SET (optional)'}`);

// Verify the file was created successfully
if (fs.existsSync(envPath)) {
  console.log(`✅ Environment file created at: ${envPath}`);
} else {
  console.error('❌ Failed to create environment file');
  process.exit(1);
}
