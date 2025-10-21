import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  // CORS proxies for DeepL API (fallback chain) - Only use reputable proxies
  private readonly DEEPL_CORS_PROXIES = [
    'https://api.allorigins.win/get?url='
  ];
  private readonly DEEPL_API_URL = environment.deeplApiUrl;
  private readonly DEEPL_API_KEY = environment.deeplApiKey;
  private currentProxyIndex = 0;

  // For Google Translate API (alternative)
  private readonly GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
  private readonly GOOGLE_API_KEY = ''; // Add your Google API key here

  // Enhanced translation cache for better performance
  private translationCache = new Map<string, string>();
  private isTranslating = false;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(private http: HttpClient) {
    if (!this.isConfigured()) {
      console.warn('⚠️ Translation service API keys not configured. Using fallback translations.');
    }
  }

  /**
   * Check if API keys are properly configured
   */
  isConfigured(): boolean {
    return !!(this.DEEPL_API_KEY &&
             this.DEEPL_API_KEY !== 'YOUR_DEEPL_API_KEY_HERE' &&
             this.DEEPL_API_KEY.length > 0);
  }

  /**
   * Translate text from German to English using DeepL API
   */
  translateToEnglish(text: string, fromLanguage: string = 'DE'): Observable<TranslationResponse> {
    // Check cache first
    const cacheKey = `${fromLanguage}-EN-${text.substring(0, 100)}`;
    if (this.translationCache.has(cacheKey)) {
      console.log('📦 Using cached translation');
      return of({
        translatedText: this.translationCache.get(cacheKey)!,
        detectedLanguage: fromLanguage,
        confidence: 1.0
      });
    }

    // Try DeepL API first (with better CORS proxy)
    return this.translateWithDeepL(text, fromLanguage).pipe(
      catchError(error => {
        console.log('🔄 DeepL failed, using intelligent translation');
        return this.getIntelligentTranslation(text);
      })
    );
  }

  /**
   * Try DeepL API with MyMemory as fallback (works better with CORS)
   */
  private translateWithDeepL(text: string, fromLanguage: string): Observable<TranslationResponse> {
    // First try DeepL with better proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const deeplUrl = encodeURIComponent(`${this.DEEPL_API_URL}?auth_key=${this.DEEPL_API_KEY}&text=${encodeURIComponent(text)}&source_lang=${fromLanguage}&target_lang=EN`);

    return this.http.get<any>(`${proxyUrl}${deeplUrl}`).pipe(
      map(response => {
        if (response.translations && response.translations.length > 0) {
          const translatedText = response.translations[0].text;
          // Cache the result
          const cacheKey = `${fromLanguage}-EN-${text.substring(0, 100)}`;
          this.translationCache.set(cacheKey, translatedText);

          console.log('✅ DeepL translation successful');
          return {
            translatedText: translatedText,
            detectedLanguage: fromLanguage,
            confidence: 0.95
          };
        }
        throw new Error('Invalid DeepL response');
      }),
      catchError(() => {
        // If DeepL fails, try MyMemory API (free and CORS-friendly)
        return this.translateWithMyMemory(text, fromLanguage);
      })
    );
  }

  /**
   * Use MyMemory translation API (free, no API key needed, CORS-friendly)
   */
  private translateWithMyMemory(text: string, fromLanguage: string): Observable<TranslationResponse> {
    const langPair = `${fromLanguage.toLowerCase()}|en`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.responseStatus === 200 && response.responseData) {
          const translatedText = response.responseData.translatedText;

          // Cache the result
          const cacheKey = `${fromLanguage}-EN-${text.substring(0, 100)}`;
          this.translationCache.set(cacheKey, translatedText);

          console.log('✅ MyMemory translation successful');
          return {
            translatedText: translatedText,
            detectedLanguage: fromLanguage,
            confidence: 0.85
          };
        }
        throw new Error('MyMemory translation failed');
      })
    );
  }

  /**
   * Translate text using Google Translate API (alternative)
   */
  translateWithGoogle(text: string, fromLanguage: string = 'de', toLanguage: string = 'en'): Observable<TranslationResponse> {
    if (!this.GOOGLE_API_KEY) {
      return this.getEnhancedMockTranslation(text);
    }

    const params = {
      key: this.GOOGLE_API_KEY,
      q: text,
      source: fromLanguage,
      target: toLanguage,
      format: 'text'
    };

    return this.http.post<any>(this.GOOGLE_TRANSLATE_URL, null, { params }).pipe(
      map(response => ({
        translatedText: response.data.translations[0].translatedText,
        detectedLanguage: response.data.translations[0].detectedSourceLanguage,
        confidence: 1.0
      })),
      catchError(error => {
        console.error('Translation error:', error);
        return this.getEnhancedMockTranslation(text);
      })
    );
  }

  /**
   * Detect language of text
   */
  detectLanguage(text: string): Observable<{ language: string; confidence: number }> {
    // Simple mock detection for development
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'zu', 'ein', 'eine', 'nicht', 'sich'];
    const lowerText = text.toLowerCase();
    const germanWordCount = germanWords.filter(word => lowerText.includes(word)).length;

    return of({
      language: germanWordCount > 2 ? 'de' : 'en',
      confidence: Math.min(0.95, 0.5 + (germanWordCount * 0.1))
    });
  }

  /**
   * Enhanced mock translation for development (fallback method)
   */
  private getEnhancedMockTranslation(text: string): Observable<TranslationResponse> {
    // Use the intelligent translation system
    return this.getIntelligentTranslation(text);
  }

  /**
   * Intelligent translation using comprehensive German-English dictionary
   */
  private getIntelligentTranslation(text: string): Observable<TranslationResponse> {
    // Use comprehensive German-English word replacement
    let translatedText = this.translateGermanWords(text);

    // Calculate translation quality
    const translationRatio = this.calculateTranslationRatio(text, translatedText);

    // If minimal translation occurred, add context
    if (translationRatio < 0.3 && text.length > 30) {
      translatedText = `${translatedText} [German text partially translated - better API key needed for full translation]`;
    }

    // Cache the result
    const cacheKey = `DE-EN-${text.substring(0, 100)}`;
    this.translationCache.set(cacheKey, translatedText);

    console.log(`🧠 Intelligent translation: "${text.substring(0, 30)}..." → "${translatedText.substring(0, 30)}..."`);
    return of({
      translatedText: translatedText,
      detectedLanguage: 'de',
      confidence: translationRatio
    });
  }

  /**
   * Comprehensive German to English word translation
   */
  private translateGermanWords(text: string): string {
    // Enhanced German-English dictionary for better translations
    const mockTranslations: { [key: string]: string } = {
      // Politics & Government
      'Bundestag': 'Federal Parliament',
      'Bundesregierung': 'Federal Government',
      'Deutschland': 'Germany',
      'Politik': 'Politics',
      'Politiker': 'Politician',
      'Kanzler': 'Chancellor',
      'Minister': 'Minister',
      'Parlament': 'Parliament',
      'Wahl': 'Election',
      'Demokratie': 'Democracy',

      // Economy & Business
      'Wirtschaft': 'Economy',
      'Unternehmen': 'Company',
      'Markt': 'Market',
      'Handel': 'Trade',
      'Export': 'Export',
      'Import': 'Import',
      'Arbeitsplatz': 'Workplace',
      'Arbeitslosigkeit': 'Unemployment',
      'Inflation': 'Inflation',
      'Wachstum': 'Growth',

      // Technology & Science
      'Technologie': 'Technology',
      'Wissenschaft': 'Science',
      'Forschung': 'Research',
      'Innovation': 'Innovation',
      'Digitalisierung': 'Digitalization',
      'Computer': 'Computer',
      'Internet': 'Internet',
      'künstliche Intelligenz': 'artificial intelligence',
      'KI': 'AI',

      // Health & Environment
      'Gesundheit': 'Health',
      'Umwelt': 'Environment',
      'Klimaschutz': 'Climate Protection',
      'Klimawandel': 'Climate Change',
      'Coronavirus': 'Coronavirus',
      'Pandemie': 'Pandemic',
      'Impfstoff': 'Vaccine',
      'Energie': 'Energy',
      'Nachhaltigkeit': 'Sustainability',

      // Common verbs and phrases
      'beschließt': 'decides',
      'beschlossen': 'decided',
      'zeigt': 'shows',
      'entwickelt': 'develops',
      'entwicklung': 'development',
      'steigt': 'rises',
      'fällt': 'falls',
      'wächst': 'grows',
      'sinkt': 'sinks',
      'erreicht': 'reaches',
      'plant': 'plans',
      'will': 'wants to',
      'soll': 'should',
      'muss': 'must',
      'kann': 'can',
      'neue': 'new',
      'neuer': 'new',
      'neues': 'new',
      'große': 'large',
      'großer': 'large',
      'großes': 'large',
      'erste': 'first',
      'erster': 'first',
      'erstes': 'first',

      // Time expressions
      'heute': 'today',
      'gestern': 'yesterday',
      'morgen': 'tomorrow',
      'jetzt': 'now',
      'bald': 'soon',
      'Jahr': 'year',
      'Jahre': 'years',
      'Monat': 'month',
      'Monate': 'months',
      'Tag': 'day',
      'Tage': 'days'
    };

    let translatedText = text;

    // Apply smart word replacement
    Object.keys(mockTranslations).forEach(germanWord => {
      const englishWord = mockTranslations[germanWord];
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${germanWord}\\b`, 'gi');
      translatedText = translatedText.replace(regex, englishWord);
    });

    // Handle common German sentence structures
    translatedText = translatedText
      .replace(/(\w+) hat (\w+)/gi, '$1 has $2')
      .replace(/(\w+) ist (\w+)/gi, '$1 is $2')
      .replace(/(\w+) wird (\w+)/gi, '$1 will be $2')
      .replace(/(\w+) wurde (\w+)/gi, '$1 was $2')
      .replace(/im (\w+)/gi, 'in the $1')
      .replace(/am (\w+)/gi, 'on the $1')
      .replace(/zur (\w+)/gi, 'to the $1')
      .replace(/vom (\w+)/gi, 'from the $1');

    // Handle German umlauts
    translatedText = translatedText
      .replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
      .replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
      .replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
      .replace(/ß/g, 'ss');

    return translatedText;
  }

  /**
   * Calculate how much of the text was actually translated
   */
  private calculateTranslationRatio(original: string, translated: string): number {
    if (original === translated) return 0;

    const originalWords = original.toLowerCase().split(/\s+/);
    const translatedWords = translated.toLowerCase().split(/\s+/);

    let changedWords = 0;
    for (let i = 0; i < Math.min(originalWords.length, translatedWords.length); i++) {
      if (originalWords[i] !== translatedWords[i]) {
        changedWords++;
      }
    }

    return changedWords / originalWords.length;
  }


  /**
   * Get translation service status
   */
  getStatus(): { service: string; configured: boolean; requestCount: number } {
    return {
      service: this.isConfigured() ? 'DeepL API' : 'Enhanced Mock',
      configured: this.isConfigured(),
      requestCount: this.requestCount
    };
  }

  /**
   * Test API connection
   */
  testConnection(): Observable<boolean> {
    if (!this.isConfigured()) {
      return of(false);
    }

    return this.translateToEnglish('Hallo Welt').pipe(
      map(result => result.translatedText.toLowerCase().includes('hello')),
      catchError(() => of(false))
    );
  }
}
