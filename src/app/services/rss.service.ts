import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, from } from 'rxjs';
import { map, catchError, switchMap, delay } from 'rxjs/operators';
import { NewsArticle, NewsCategory, NewsSource } from '../models/news.interface';
import { TranslationService } from './translation.service';
import { RssCacheService } from './rss-cache.service';
import { IndexedDBCacheService } from './indexeddb-cache.service';

export interface RSSFeed {
  url: string; // API endpoint URL (will be built with API key)
  rssUrl: string; // The actual RSS feed URL
  source: NewsSource;
  category: NewsCategory;
  proxy?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RSSService {
  // RSS2JSON API Configuration
  private readonly RSS2JSON_API_KEY = '8rbktxazq9pwkhrtxrg1nfobod3pqdbdvojlfmnq';
  private readonly RSS2JSON_BASE_URL = 'https://api.rss2json.com/v1/api.json';

  // German RSS feeds with authenticated RSS2JSON API
  private rssSources: RSSFeed[] = [
    {
      url: '', // Will be built dynamically with API key
      rssUrl: 'https://www.spiegel.de/schlagzeilen/index.rss',
      source: {
        id: 'spiegel',
        name: 'Der Spiegel',
        url: 'https://www.spiegel.de',
        logoUrl: '/assets/icons/news-placeholder.svg',
        reliability: 5
      },
      category: NewsCategory.POLITICS,
      proxy: true
    },
    {
      url: '', // Will be built dynamically with API key
      rssUrl: 'https://www.faz.net/rss/aktuell/',
      source: {
        id: 'faz',
        name: 'Frankfurter Allgemeine Zeitung',
        url: 'https://www.faz.net',
        logoUrl: '/assets/icons/news-placeholder.svg',
        reliability: 5
      },
      category: NewsCategory.POLITICS,
      proxy: true
    },
    {
      url: '', // Will be built dynamically with API key
      rssUrl: 'https://www.zeit.de/news/index',
      source: {
        id: 'zeit',
        name: 'Die Zeit',
        url: 'https://www.zeit.de',
        logoUrl: '/assets/icons/news-placeholder.svg',
        reliability: 5
      },
      category: NewsCategory.POLITICS,
      proxy: true
    },
    {
      url: '', // Will be built dynamically with API key
      rssUrl: 'https://www.tagesschau.de/xml/rss2/',
      source: {
        id: 'tagesschau',
        name: 'Tagesschau',
        url: 'https://www.tagesschau.de',
        logoUrl: '/assets/icons/news-placeholder.svg',
        reliability: 5
      },
      category: NewsCategory.POLITICS,
      proxy: true
    },
    {
      url: '', // Will be built dynamically with API key
      rssUrl: 'https://www.handelsblatt.com/contentexport/feed/schlagzeilen',
      source: {
        id: 'handelsblatt',
        name: 'Handelsblatt',
        url: 'https://www.handelsblatt.com',
        logoUrl: '/assets/icons/news-placeholder.svg',
        reliability: 5
      },
      category: NewsCategory.BUSINESS,
      proxy: true
    },
    {
      url: '', // Will be built dynamically with API key
      rssUrl: 'https://www.heise.de/rss/heise-atom.xml',
      source: {
        id: 'heise',
        name: 'Heise Online',
        url: 'https://www.heise.de',
        logoUrl: '/assets/icons/news-placeholder.svg',
        reliability: 4
      },
      category: NewsCategory.TECHNOLOGY,
      proxy: true
    }
  ];

  constructor(
    private http: HttpClient,
    private translationService: TranslationService,
    private cacheService: RssCacheService,
    private indexedDBCache: IndexedDBCacheService
  ) {
    // Clear old cache that doesn't have translations
    this.clearOldUntranslatedCache();
  }

  /**
   * Clear old cache that doesn't have translated articles
   */
  private clearOldUntranslatedCache(): void {
    // This will clear the cache once to rebuild with translated articles
    const CACHE_VERSION_KEY = 'cacheVersionWithTranslations';
    const CURRENT_VERSION = '2.0';

    if (typeof localStorage !== 'undefined') {
      const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      if (cachedVersion !== CURRENT_VERSION) {
        console.log('🧹 Clearing old cache to rebuild with translations...');
        this.indexedDBCache.clearCache().subscribe({
          next: () => {
            localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
            console.log('✅ Cache cleared - will rebuild with translated articles');
          },
          error: (error) => {
            console.error('❌ Failed to clear old cache:', error);
          }
        });
      }
    }
  }

  /**
   * Fetch news from all RSS sources - with IndexedDB persistent caching
   */
  fetchAllNews(): Observable<NewsArticle[]> {
    console.log('🗄️ Checking IndexedDB cache for German news...');

    // First, check IndexedDB cache
    return this.indexedDBCache.getAllCachedArticles().pipe(
      switchMap(cachedArticles => {
        // If we have cached articles, check if we should fetch new ones
        if (cachedArticles.length > 0) {
          return this.indexedDBCache.shouldFetch().pipe(
            switchMap(shouldFetch => {
              if (!shouldFetch) {
                return this.indexedDBCache.getTimeUntilNextFetch().pipe(
                  map(timeUntilNext => {
                    const minutesRemaining = Math.ceil(timeUntilNext / (60 * 1000));
                    console.log(`📦 IndexedDB: Using cached German news (${cachedArticles.length} articles)`);
                    console.log(`⏱️ Next fetch allowed in ${minutesRemaining} minutes`);
                    return cachedArticles;
                  })
                );
              } else {
                // Fetch fresh data but return cached as fallback
                return this.fetchFreshNews().pipe(
                  catchError(() => {
                    console.log('🔄 Using IndexedDB cache as fallback');
                    return of(cachedArticles);
                  })
                );
              }
            })
          );
        } else {
          // No cache, fetch fresh data
          return this.fetchFreshNews();
        }
      })
    );

  }

  /**
   * Fetch fresh news from RSS sources
   */
  private fetchFreshNews(): Observable<NewsArticle[]> {
    console.log('🌐 RSS Service: Fetching fresh German news (respecting rate limits)...');
    this.indexedDBCache.updateLastFetchTime().subscribe();

    const requests = this.rssSources.map(feed => this.fetchRSSFeed(feed));

    return forkJoin(requests).pipe(
      map(results => {
        const allArticles: NewsArticle[] = [];
        let realArticlesCount = 0;
        let rateLimitedCount = 0;

        results.forEach((result, index) => {
          const feed = this.rssSources[index];

          if (result && result.length > 0) {
            // DON'T cache here - we'll cache AFTER translation
            // Check if these are real articles (have actual URLs)
            if (result[0].url && !result[0].url.includes('example.com')) {
              realArticlesCount += result.length;
              console.log(`✅ ${feed.source.name}: Got ${result.length} real articles`);
            }
            allArticles.push(...result);
          } else {
            // Try to use IndexedDB cached data for this source if available
            this.indexedDBCache.getCachedArticles(feed.source.id).subscribe(cached => {
              if (cached.length > 0) {
                allArticles.push(...cached);
                console.log(`📦 ${feed.source.name}: Using IndexedDB cached articles (${cached.length})`);
              }
            });
            rateLimitedCount++;
          }
        });

        if (realArticlesCount === 0 && rateLimitedCount > 0) {
          console.log('⏱️ All RSS feeds are rate limited');
          // If we have any cached articles, use them
          if (allArticles.length === 0) {
            const fallbackCached = this.cacheService.getAllCachedArticles();
            if (fallbackCached.length > 0) {
              console.log(`📦 Using fallback cached articles (${fallbackCached.length})`);
              return fallbackCached;
            }
          }
        } else if (realArticlesCount > 0) {
          console.log(`🎉 Successfully loaded ${realArticlesCount} fresh German news articles!`);
        }

        // Sort with translated articles first, then by publication date
        return this.sortArticlesWithTranslatedFirst(allArticles);
      }),
      // Auto-translate articles after fetching
      switchMap(articles => this.translateArticles(articles)),
      catchError(error => {
        console.error('Error fetching RSS feeds:', error);
        // Return IndexedDB cached articles as fallback
        return this.indexedDBCache.getAllCachedArticles().pipe(
          map(cachedFallback => {
            if (cachedFallback.length > 0) {
              console.log(`📦 Error fallback: Using IndexedDB cached articles (${cachedFallback.length})`);
              return cachedFallback;
            }
            return [];
          }),
          catchError(() => of([]))
        );
      })
    );
  }

  /**
   * Build RSS2JSON API URL with authentication
   */
  private buildRSS2JSONUrl(rssUrl: string): string {
    const params = new URLSearchParams({
      'rss_url': rssUrl,
      'api_key': this.RSS2JSON_API_KEY,
      'count': '15' // Increased: More articles per German source
    });
    return `${this.RSS2JSON_BASE_URL}?${params.toString()}`;
  }

  /**
   * Fetch news from specific RSS feed - using authenticated RSS2JSON API
   */
  private fetchRSSFeed(feed: RSSFeed): Observable<NewsArticle[]> {
    console.log(`🔑 Fetching authenticated RSS from ${feed.source.name}...`);

    const apiUrl = this.buildRSS2JSONUrl(feed.rssUrl);

    return this.http.get<any>(apiUrl).pipe(
      map(response => {
        if (feed.proxy && response.status === 'ok' && response.items) {
          // RSS2JSON proxy response - REAL NEWS!
          const articles = this.parseRSS2JSONResponse(response, feed);
          console.log(`✅ ${feed.source.name}: Got ${articles.length} real articles`);
          return articles;
        } else if (response.rss || response.feed) {
          // Direct RSS response - REAL NEWS!
          const articles = this.parseDirectRSSResponse(response, feed);
          console.log(`✅ ${feed.source.name}: Got ${articles.length} real articles`);
          return articles;
        } else {
          console.warn(`⚠️ ${feed.source.name}: Unknown RSS format`);
          return [];
        }
      }),
      catchError(error => {
        if (error.status === 429) {
          console.log(`⏱️ ${feed.source.name}: Rate limited (429) - even with API key`);
          return of([]);
        } else if (error.status === 403) {
          console.log(`🔑 ${feed.source.name}: API key issue (403) - check key validity`);
          return of([]);
        } else if (error.status === 402) {
          console.log(`💰 ${feed.source.name}: API quota exceeded (402) - upgrade plan needed`);
          return of([]);
        } else {
          console.warn(`❌ ${feed.source.name}: RSS error (${error.status || error.message})`);
          return of([]);
        }
      }),
      delay(100) // Shorter delay since we have authenticated API access
    );
  }

  /**
   * Parse RSS2JSON proxy response
   */
  private parseRSS2JSONResponse(response: any, feed: RSSFeed): NewsArticle[] {
    return response.items.slice(0, 15).map((item: any, index: number) => {
      const article: NewsArticle = {
        id: `${feed.source.id}-${Date.now()}-${index}`,
        title: this.cleanText(item.title || 'Untitled'),
        titleTranslated: undefined, // Will be filled by translation service
        content: this.cleanText(item.description || item.content || ''),
        contentTranslated: undefined, // Will be filled by translation service
        summary: this.generateSummary(item.description || item.content || ''),
        imageUrl: this.extractImageUrl(item),
        source: feed.source,
        category: feed.category,
        publishedAt: new Date(item.pubDate || item.published || Date.now()),
        url: item.link || item.url || '#',
        author: item.author || 'Unknown',
        readTime: this.calculateReadTime(item.description || item.content || '')
      };
      return article;
    });
  }

  /**
   * Parse direct RSS response
   */
  private parseDirectRSSResponse(response: any, feed: RSSFeed): NewsArticle[] {
    // Handle direct RSS XML responses (if needed)
    // This would require xml2js parsing
    console.log('Direct RSS parsing not implemented yet');
    return [];
  }

  /**
   * Extract image URL from RSS item
   */
  private extractImageUrl(item: any): string | undefined {
    // Try multiple fields where images might be stored
    if (item.enclosure?.link && item.enclosure.type?.startsWith('image')) {
      return item.enclosure.link;
    }
    if (item.thumbnail) {
      return item.thumbnail;
    }
    if (item['media:thumbnail']?.url) {
      return item['media:thumbnail'].url;
    }

    // Extract from description HTML
    const imgMatch = item.description?.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }

    // Use a placeholder image from a German news context
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/400/300?random=${randomId}`;
  }

  /**
   * Clean HTML tags and entities from text
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .replace(/&#39;/g, "'") // Replace &#39;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate a summary from content
   */
  private generateSummary(content: string): string {
    const cleanContent = this.cleanText(content);
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length === 0) return 'No summary available.';

    // Take first 2-3 sentences or first 150 characters, whichever is shorter
    const summary = sentences.slice(0, 2).join('. ');
    return summary.length > 150 ? summary.substring(0, 150) + '...' : summary + '.';
  }

  /**
   * Calculate estimated read time in minutes
   */
  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.cleanText(content).split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Get RSS sources for a specific category
   */
  getRSSSourcesByCategory(category: NewsCategory): RSSFeed[] {
    return this.rssSources.filter(feed => feed.category === category);
  }

  /**
   * Translate a single article on demand - PUBLIC METHOD
   * Supports both initial translation and retranslation
   */
  translateArticleOnDemand(article: NewsArticle): Observable<NewsArticle> {
    const isRetranslation = article.titleTranslated && article.contentTranslated;
    console.log(`🔄 On-demand ${isRetranslation ? 'retranslation' : 'translation'}: "${article.title.substring(0, 50)}..."`);

    // Check if translation service is configured
    if (!this.translationService.isConfigured()) {
      console.log('⚠️ Translation service not configured');
      return of(article);
    }

    return this.translateSingleArticle(article).pipe(
      map(translatedArticle => {
        // Update the cache with the newly translated article
        this.updateSingleArticleInCache(translatedArticle);
        console.log(`✅ On-demand ${isRetranslation ? 'retranslation' : 'translation'} complete: "${translatedArticle.titleTranslated?.substring(0, 50)}..."`);
        return translatedArticle;
      }),
      catchError(error => {
        console.error('❌ On-demand translation failed:', error);
        return of(article);
      })
    );
  }

  /**
   * Update a single translated article in the IndexedDB cache
   */
  private updateSingleArticleInCache(article: NewsArticle): void {
    // Get all cached articles for this source
    this.indexedDBCache.getCachedArticles(article.source.id).subscribe({
      next: (cachedArticles) => {
        // Find and update the specific article
        const updatedArticles = cachedArticles.map(cached =>
          cached.id === article.id ? article : cached
        );

        // If article wasn't found in cache, add it
        if (!cachedArticles.some(cached => cached.id === article.id)) {
          updatedArticles.push(article);
        }

        // Re-cache the updated articles
        this.indexedDBCache.cacheArticles(article.source.id, updatedArticles).subscribe({
          next: () => {
            console.log(`💾 Updated translated article in cache: ${article.source.id}`);
          },
          error: (error) => {
            console.error('❌ Failed to update article in cache:', error);
          }
        });
      },
      error: (error) => {
        console.error('❌ Failed to get cached articles:', error);
      }
    });
  }

  /**
   * Translate multiple articles - only first 15 for initial load
   */
  private translateArticles(articles: NewsArticle[]): Observable<NewsArticle[]> {
    console.log(`🔄 Starting translation for first 15 of ${articles.length} articles...`);

    if (articles.length === 0) {
      return of([]);
    }

    // Check if translation service is configured
    if (!this.translationService.isConfigured()) {
      console.log('⚠️ Translation service not configured, using original German articles');
      return of(articles);
    }

    // Translate only first 15 articles for faster initial load
    const INITIAL_TRANSLATION_COUNT = 15;
    const articlesToTranslate = articles.slice(0, INITIAL_TRANSLATION_COUNT);
    console.log(`🇩🇪➡️🇺🇸 Translating ${articlesToTranslate.length} German articles to English...`);

    const translationRequests = articlesToTranslate.map(article =>
      this.translateSingleArticle(article)
    );

    return forkJoin(translationRequests).pipe(
      map(translatedArticles => {
        const successfulTranslations = translatedArticles.filter(a => a.titleTranslated);
        console.log(`✅ Successfully translated ${successfulTranslations.length} German articles to English`);

        // Combine translated articles with remaining untranslated ones
        const finalArticles = [...translatedArticles, ...articles.slice(INITIAL_TRANSLATION_COUNT)];

        // Sort with translated articles first
        const sortedArticles = this.sortArticlesWithTranslatedFirst(finalArticles);

        // Cache translated articles by source
        this.cacheTranslatedArticlesBySource(sortedArticles);

        return sortedArticles;
      }),
      catchError(error => {
        console.error('❌ Translation failed, returning original articles:', error);
        return of(articles);
      })
    );
  }

  /**
   * Cache translated articles grouped by source
   */
  private cacheTranslatedArticlesBySource(articles: NewsArticle[]): void {
    // Group articles by source
    const articlesBySource = new Map<string, NewsArticle[]>();

    articles.forEach(article => {
      const sourceId = article.source.id;
      if (!articlesBySource.has(sourceId)) {
        articlesBySource.set(sourceId, []);
      }
      articlesBySource.get(sourceId)!.push(article);
    });

    // Cache each source's articles (now WITH translations)
    articlesBySource.forEach((sourceArticles, sourceId) => {
      this.indexedDBCache.cacheArticles(sourceId, sourceArticles).subscribe({
        next: () => {
          console.log(`💾 IndexedDB: Cached ${sourceArticles.length} TRANSLATED articles for source ${sourceId}`);
        },
        error: (error) => {
          console.error(`❌ IndexedDB: Failed to cache translated articles for ${sourceId}:`, error);
        }
      });
    });
  }

  /**
   * Translate a single article
   */
  private translateSingleArticle(article: NewsArticle): Observable<NewsArticle> {
    console.log(`🔄 Translating: "${article.title.substring(0, 50)}..."`);

    // Translate title and content in parallel
    const titleTranslation$ = this.translationService.translateToEnglish(article.title);
    const contentTranslation$ = this.translationService.translateToEnglish(
      article.content.length > 300 ? article.content.substring(0, 300) + '...' : article.content
    );

    return forkJoin({
      title: titleTranslation$,
      content: contentTranslation$
    }).pipe(
      map(translations => {
        console.log(`✅ Translated: "${translations.title.translatedText.substring(0, 50)}..."`);

        return {
          ...article,
          titleTranslated: translations.title.translatedText,
          contentTranslated: translations.content.translatedText,
          // Generate better summary from translated content
          summary: this.generateEnglishSummary(translations.content.translatedText)
        };
      }),
      catchError(error => {
        console.error(`❌ Translation failed for article "${article.title.substring(0, 30)}...":`, error);
        return of(article); // Return original article if translation fails
      })
    );
  }

  /**
   * Generate summary from translated English content
   */
  private generateEnglishSummary(englishContent: string): string {
    const sentences = englishContent.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length === 0) return 'No summary available.';

    // Take first 2 sentences or first 120 characters
    let summary = sentences.slice(0, 2).join('. ').trim();
    if (summary.length > 120) {
      summary = summary.substring(0, 120) + '...';
    } else if (!summary.endsWith('.')) {
      summary += '.';
    }

    return summary;
  }

  /**
   * Sort articles with translated articles first, then by publication date
   */
  private sortArticlesWithTranslatedFirst(articles: NewsArticle[]): NewsArticle[] {
    return articles.sort((a, b) => {
      // Check if articles are translated
      const aTranslated = !!(a.titleTranslated && a.contentTranslated);
      const bTranslated = !!(b.titleTranslated && b.contentTranslated);

      // If translation status is different, prioritize translated articles
      if (aTranslated !== bTranslated) {
        return bTranslated ? 1 : -1; // Translated articles come first
      }

      // If both have same translation status, sort by publication date (newest first)
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  /**
   * Get all available RSS sources
   */
  getAllRSSSources(): RSSFeed[] {
    return this.rssSources;
  }

  /**
   * Clear all cache and fetch fresh news
   */
  refreshAllNews(): Observable<NewsArticle[]> {
    console.log('🔄 Refreshing news: Clearing cache and fetching fresh content...');

    return this.indexedDBCache.clearCache().pipe(
      switchMap(() => {
        // Clear in-memory cache as well
        this.cacheService.clearCache();
        console.log('🗑️ All caches cleared, fetching fresh news...');

        // Fetch fresh news (bypassing cache)
        return this.fetchFreshNews();
      }),
      map(articles => {
        console.log(`✅ News refreshed successfully: ${articles.length} fresh articles loaded`);
        return articles;
      }),
      catchError(error => {
        console.error('❌ Failed to refresh news:', error);
        // Fallback to any remaining cached articles
        return this.indexedDBCache.getAllCachedArticles().pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  /**
   * Generate mock articles when RSS feeds fail (fallback)
   */
  private generateMockArticles(source: NewsSource, category: NewsCategory): Observable<NewsArticle[]> {
    console.log(`📰 Generating mock articles for ${source.name} in ${category}`);

    const mockArticleTemplates = [
      {
        title: 'Bundestag beschließt neue Klimaschutzmaßnahmen',
        titleTranslated: 'German Parliament passes new climate protection measures',
        content: 'Der Deutsche Bundestag hat heute mit großer Mehrheit ein umfassendes Paket neuer Klimaschutzmaßnahmen beschlossen. Die Regelungen sollen ab dem kommenden Jahr in Kraft treten.',
        contentTranslated: 'The German Parliament today passed a comprehensive package of new climate protection measures by a large majority. The regulations are set to take effect from next year.',
        summary: 'German Parliament approves significant climate protection legislation with broad support, effective from next year.',
        category: NewsCategory.POLITICS
      },
      {
        title: 'Deutsche Wirtschaft zeigt robustes Wachstum',
        titleTranslated: 'German economy shows robust growth',
        content: 'Die deutsche Wirtschaft verzeichnet im dritten Quartal ein überraschend starkes Wachstum von 1,2 Prozent gegenüber dem Vorquartal.',
        contentTranslated: 'The German economy recorded surprisingly strong growth of 1.2 percent compared to the previous quarter in the third quarter.',
        summary: 'German economy demonstrates unexpected strength with 1.2% quarterly growth, exceeding expert predictions.',
        category: NewsCategory.BUSINESS
      },
      {
        title: 'Durchbruch in erneuerbarer Energietechnologie',
        titleTranslated: 'Breakthrough in renewable energy technology',
        content: 'Deutsche Wissenschaftler haben eine bahnbrechende Technologie zur Energiespeicherung entwickelt, die Solarzellen effizienter macht.',
        contentTranslated: 'German scientists have developed a groundbreaking energy storage technology that makes solar cells more efficient.',
        summary: 'German researchers achieve breakthrough in solar technology, boosting renewable energy prospects.',
        category: NewsCategory.TECHNOLOGY
      },
      {
        title: 'Bayern München erreicht Champions League Finale',
        titleTranslated: 'Bayern Munich reaches Champions League final',
        content: 'In einem dramatischen Halbfinale setzte sich Bayern München mit 3:2 durch und steht im Champions League Finale.',
        contentTranslated: 'In a dramatic semi-final, Bayern Munich prevailed 3:2 and reached the Champions League final.',
        summary: 'Bayern Munich secures Champions League final spot with dramatic 3:2 victory in thrilling match.',
        category: NewsCategory.SPORTS
      }
    ];

    // Filter articles by category or use random ones
    let relevantArticles = mockArticleTemplates.filter(template => template.category === category);
    if (relevantArticles.length === 0) {
      relevantArticles = mockArticleTemplates.slice(0, 2); // Take first 2 if no category match
    }

    const articles: NewsArticle[] = relevantArticles.map((template, index) => ({
      id: `mock-${source.id}-${Date.now()}-${index}`,
      title: template.title,
      titleTranslated: template.titleTranslated,
      content: template.content,
      contentTranslated: template.contentTranslated,
      summary: template.summary,
      imageUrl: `/assets/icons/news-placeholder.svg`,
      source: source,
      category: template.category,
      publishedAt: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
      url: `https://example.com/news/${template.title.toLowerCase().replace(/\s+/g, '-')}`,
      author: `${source.name} Redaktion`,
      readTime: Math.ceil(template.content.split(' ').length / 200)
    }));

    return of(articles); // No delay needed for mock articles
  }
}
