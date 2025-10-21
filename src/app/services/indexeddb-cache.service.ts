import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { NewsArticle } from '../models/news.interface';

interface CacheEntry {
  id: string;
  articles: NewsArticle[];
  timestamp: number;
  source: string;
  version: number; // For cache invalidation
}

interface CacheMetadata {
  lastFetchTime: number;
  totalArticles: number;
  sources: string[];
  version: number;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDBCacheService {
  private readonly DB_NAME = 'GermanNewsCache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'articles';
  private readonly METADATA_STORE = 'metadata';

  // Cache configuration
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly MIN_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ARTICLES_PER_SOURCE = 100; // Increased for IndexedDB
  private readonly MAX_TOTAL_ARTICLES = 500; // Total across all sources

  private db: IDBDatabase | null = null;
  private cacheUpdated$ = new BehaviorSubject<boolean>(false);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.initDB();
    }
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create articles store
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const articlesStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          articlesStore.createIndex('source', 'source', { unique: false });
          articlesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(this.METADATA_STORE)) {
          db.createObjectStore(this.METADATA_STORE, { keyPath: 'key' });
        }

        console.log('🏗️ IndexedDB schema created');
      };
    });
  }

  /**
   * Check if we should fetch new data
   */
  shouldFetch(): Observable<boolean> {
    if (!this.isBrowser) {
      return of(true); // Always fetch on server
    }

    return from(this.getMetadata()).pipe(
      map(metadata => {
        if (!metadata) return true;

        const timeSinceLastFetch = Date.now() - metadata.lastFetchTime;
        return timeSinceLastFetch >= this.MIN_FETCH_INTERVAL;
      }),
      catchError(() => of(true))
    );
  }

  /**
   * Get cached articles for a specific source
   */
  getCachedArticles(source: string): Observable<NewsArticle[]> {
    if (!this.isBrowser) {
      return of([]); // Return empty array on server
    }

    return from(this.initDB()).pipe(
      switchMap(() => from(this.getArticlesBySource(source))),
      map(entry => {
        if (!entry) return [];

        const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
        if (isExpired) {
          this.deleteExpiredCache(source);
          return [];
        }

        console.log(`📦 IndexedDB: Using cached articles for ${source} (${entry.articles.length} articles)`);
        return entry.articles;
      }),
      catchError(() => {
        console.warn(`⚠️ IndexedDB: Failed to get cached articles for ${source}`);
        return of([]);
      })
    );
  }

  /**
   * Get all cached articles from all sources
   */
  getAllCachedArticles(): Observable<NewsArticle[]> {
    if (!this.isBrowser) {
      return of([]); // Return empty array on server
    }

    return from(this.initDB()).pipe(
      switchMap(() => from(this.getAllValidEntries())),
      map(entries => {
        const allArticles: NewsArticle[] = [];

        entries.forEach(entry => {
          const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
          if (!isExpired) {
            allArticles.push(...entry.articles);
          }
        });

        // Sort with translated articles first, then by publication date
        const sortedArticles = this.sortArticlesWithTranslatedFirst(allArticles);

        console.log(`📦 IndexedDB: Retrieved ${sortedArticles.length} cached articles from ${entries.length} sources`);
        return sortedArticles;
      }),
      catchError(() => {
        console.warn('⚠️ IndexedDB: Failed to get all cached articles');
        return of([]);
      })
    );
  }

  /**
   * Cache articles for a source
   */
  cacheArticles(source: string, articles: NewsArticle[]): Observable<void> {
    if (!this.isBrowser) {
      return of(); // No-op on server
    }

    return from(this.initDB()).pipe(
      switchMap(() => {
        // Limit articles per source
        const limitedArticles = articles.slice(0, this.MAX_ARTICLES_PER_SOURCE);

        const cacheEntry: CacheEntry = {
          id: source,
          articles: limitedArticles,
          timestamp: Date.now(),
          source: source,
          version: 1
        };

        return from(this.storeArticles(cacheEntry));
      }),
      switchMap(() => from(this.updateMetadata())),
      map(() => {
        console.log(`💾 IndexedDB: Cached ${articles.length} articles for ${source}`);
        this.cacheUpdated$.next(true);
      }),
      catchError(error => {
        console.error(`❌ IndexedDB: Failed to cache articles for ${source}:`, error);
        return of();
      })
    );
  }

  /**
   * Update last fetch time
   */
  updateLastFetchTime(): Observable<void> {
    if (!this.isBrowser) {
      return of(); // No-op on server
    }

    return from(this.updateMetadata());
  }

  /**
   * Get cache status for UI
   */
  getCacheStatus(): Observable<{
    totalArticles: number;
    sources: number;
    nextFetchAllowed: number;
    cacheAge: string;
    storageUsed: string;
  }> {
    return from(this.initDB()).pipe(
      switchMap(() => from(this.getMetadata())),
      switchMap(metadata =>
        from(this.getAllValidEntries()).pipe(
          map(entries => {
            const totalArticles = entries.reduce((sum, entry) => sum + entry.articles.length, 0);
            const sources = entries.length;
            const nextFetchAllowed = (metadata?.lastFetchTime || 0) + this.MIN_FETCH_INTERVAL;
            const oldestTimestamp = Math.min(...entries.map(e => e.timestamp));
            const cacheAge = oldestTimestamp ? this.formatTime(Date.now() - oldestTimestamp) : 'No cache';
            const storageUsed = this.estimateStorageSize(entries);

            return { totalArticles, sources, nextFetchAllowed, cacheAge, storageUsed };
          })
        )
      ),
      catchError(() => of({
        totalArticles: 0,
        sources: 0,
        nextFetchAllowed: Date.now(),
        cacheAge: 'Unknown',
        storageUsed: '0 KB'
      }))
    );
  }

  /**
   * Clear all cache
   */
  clearCache(): Observable<void> {
    if (!this.isBrowser) {
      return of(); // No-op on server
    }

    return from(this.initDB()).pipe(
      switchMap(() => from(this.clearAllData())),
      map(() => {
        console.log('🗑️ IndexedDB: Cache cleared');
        this.cacheUpdated$.next(true);
      }),
      catchError(error => {
        console.error('❌ IndexedDB: Failed to clear cache:', error);
        return of();
      })
    );
  }

  /**
   * Get cache updates observable
   */
  getCacheUpdates(): Observable<boolean> {
    return this.cacheUpdated$.asObservable();
  }

  /**
   * Get time until next fetch is allowed
   */
  getTimeUntilNextFetch(): Observable<number> {
    return from(this.getMetadata()).pipe(
      map(metadata => {
        if (!metadata) return 0;

        const timeSinceLastFetch = Date.now() - metadata.lastFetchTime;
        const remaining = this.MIN_FETCH_INTERVAL - timeSinceLastFetch;
        return Math.max(0, remaining);
      }),
      catchError(() => of(0))
    );
  }

  // Private helper methods
  private async getArticlesBySource(source: string): Promise<CacheEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(source);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllValidEntries(): Promise<CacheEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result || [];
        // Filter out expired entries
        const validEntries = entries.filter(entry =>
          Date.now() - entry.timestamp <= this.CACHE_DURATION
        );
        resolve(validEntries);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async storeArticles(entry: CacheEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getMetadata(): Promise<CacheMetadata | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.METADATA_STORE], 'readonly');
      const store = transaction.objectStore(this.METADATA_STORE);
      const request = store.get('main');

      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async updateMetadata(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const entries = await this.getAllValidEntries();
    const metadata: CacheMetadata = {
      lastFetchTime: Date.now(),
      totalArticles: entries.reduce((sum, entry) => sum + entry.articles.length, 0),
      sources: entries.map(entry => entry.source),
      version: 1
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(this.METADATA_STORE);
      const request = store.put({ key: 'main', data: metadata });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteExpiredCache(source: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(source);

      request.onsuccess = () => {
        console.log(`🧹 IndexedDB: Cleaned expired cache for ${source}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME, this.METADATA_STORE], 'readwrite');

      const articlesStore = transaction.objectStore(this.STORE_NAME);
      const metadataStore = transaction.objectStore(this.METADATA_STORE);

      const clearArticles = articlesStore.clear();
      const clearMetadata = metadataStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private formatTime(ms: number): string {
    const minutes = Math.floor(ms / (60 * 1000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  }

  private estimateStorageSize(entries: CacheEntry[]): string {
    const totalSize = entries.reduce((size, entry) => {
      return size + JSON.stringify(entry).length;
    }, 0);

    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${Math.round(totalSize / 1024)} KB`;
    return `${Math.round(totalSize / (1024 * 1024))} MB`;
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
