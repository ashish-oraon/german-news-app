import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { NewsArticle } from '../models/news.interface';

interface CacheEntry {
  articles: NewsArticle[];
  timestamp: number;
  source: string;
}

@Injectable({
  providedIn: 'root'
})
export class RssCacheService {
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_CACHE_SIZE = 50; // Max articles per source

  private cache = new Map<string, CacheEntry>();
  private lastFetchTime = 0;
  private readonly MIN_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes between fetches

  // Subject to notify components about cache updates
  private cacheUpdated$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // Clean old cache entries every 30 minutes
    setInterval(() => this.cleanExpiredCache(), 30 * 60 * 1000);
  }

  /**
   * Check if we should fetch new data or use cache
   */
  shouldFetch(): boolean {
    const now = Date.now();
    const timeSinceLastFetch = now - this.lastFetchTime;

    return timeSinceLastFetch >= this.MIN_FETCH_INTERVAL;
  }

  /**
   * Get cached articles for a source
   */
  getCachedArticles(source: string): NewsArticle[] | null {
    const entry = this.cache.get(source);

    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(source);
      return null;
    }

    console.log(`📦 Using cached articles for ${source} (${entry.articles.length} articles)`);
    return entry.articles;
  }

  /**
   * Cache articles for a source
   */
  cacheArticles(source: string, articles: NewsArticle[]): void {
    // Limit cache size
    const limitedArticles = articles.slice(0, this.MAX_CACHE_SIZE);

    this.cache.set(source, {
      articles: limitedArticles,
      timestamp: Date.now(),
      source: source
    });

    console.log(`💾 Cached ${limitedArticles.length} articles for ${source}`);
    this.cacheUpdated$.next(true);
  }

  /**
   * Update last fetch time
   */
  updateLastFetchTime(): void {
    this.lastFetchTime = Date.now();
  }

  /**
   * Get all cached articles from all sources
   */
  getAllCachedArticles(): NewsArticle[] {
    const allArticles: NewsArticle[] = [];

    for (const entry of this.cache.values()) {
      const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
      if (!isExpired) {
        allArticles.push(...entry.articles);
      }
    }

    // Sort with translated articles first, then by publication date
    return this.sortArticlesWithTranslatedFirst(allArticles);
  }

  /**
   * Get cache status for UI
   */
  getCacheStatus(): {
    totalArticles: number;
    sources: number;
    nextFetchAllowed: number;
    cacheAge: string;
  } {
    const totalArticles = this.getAllCachedArticles().length;
    const sources = this.cache.size;
    const nextFetchAllowed = this.lastFetchTime + this.MIN_FETCH_INTERVAL;
    const oldestCache = Math.min(...Array.from(this.cache.values()).map(e => e.timestamp));
    const cacheAge = oldestCache ? this.formatTime(Date.now() - oldestCache) : 'No cache';

    return { totalArticles, sources, nextFetchAllowed, cacheAge };
  }

  /**
   * Observable for cache updates
   */
  getCacheUpdates(): Observable<boolean> {
    return this.cacheUpdated$.asObservable();
  }

  /**
   * Clear all cache (for refresh functionality)
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetchTime = 0;
    console.log('🗑️ Cache cleared');
    this.cacheUpdated$.next(true);
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const expiredSources: string[] = [];

    for (const [source, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        expiredSources.push(source);
      }
    }

    expiredSources.forEach(source => {
      this.cache.delete(source);
      console.log(`🧹 Cleaned expired cache for ${source}`);
    });

    if (expiredSources.length > 0) {
      this.cacheUpdated$.next(true);
    }
  }

  /**
   * Format time duration
   */
  private formatTime(ms: number): string {
    const minutes = Math.floor(ms / (60 * 1000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  }

  /**
   * Get time until next fetch is allowed
   */
  getTimeUntilNextFetch(): number {
    const timeSinceLastFetch = Date.now() - this.lastFetchTime;
    const remaining = this.MIN_FETCH_INTERVAL - timeSinceLastFetch;
    return Math.max(0, remaining);
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
}
