import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, delay, switchMap } from 'rxjs/operators';
import { NewsArticle, NewsCategory, NewsFilter, NewsResponse, NewsSource } from '../models/news.interface';
import { RSSService } from './rss.service';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly API_BASE_URL = 'https://api.example.com'; // Replace with actual API
  private currentPageSubject = new BehaviorSubject<number>(1);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public currentPage$ = this.currentPageSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Mock German news sources for development
  private mockSources: NewsSource[] = [
    {
      id: 'spiegel',
      name: 'Der Spiegel',
      url: 'https://www.spiegel.de',
      logoUrl: '/assets/logos/spiegel.png',
      reliability: 5
    },
    {
      id: 'faz',
      name: 'Frankfurter Allgemeine Zeitung',
      url: 'https://www.faz.net',
      logoUrl: '/assets/logos/faz.png',
      reliability: 5
    },
    {
      id: 'zeit',
      name: 'Die Zeit',
      url: 'https://www.zeit.de',
      logoUrl: '/assets/logos/zeit.png',
      reliability: 5
    },
    {
      id: 'tagesschau',
      name: 'Tagesschau',
      url: 'https://www.tagesschau.de',
      logoUrl: '/assets/logos/tagesschau.png',
      reliability: 5
    }
  ];

  constructor(
    private http: HttpClient,
    private rssService: RSSService
  ) {}

  /**
   * Get news articles with optional filtering
   */
  getNews(filter?: NewsFilter, page: number = 1, limit: number = 20): Observable<NewsResponse> {
    this.loadingSubject.next(true);

    return this.rssService.fetchAllNews().pipe(
      map(articles => {
        // Apply filters
        let filteredArticles = this.applyFilters(articles, filter);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

        const response: NewsResponse = {
          articles: paginatedArticles,
          totalResults: filteredArticles.length,
          hasMore: endIndex < filteredArticles.length,
          page: page
        };

        this.loadingSubject.next(false);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching RSS news:', error);
        this.loadingSubject.next(false);
        // Fallback to mock data if RSS fails
        return this.getMockNews(filter, page, limit);
      })
    );
  }

  /**
   * Get news by category
   */
  getNewsByCategory(category: NewsCategory, page: number = 1): Observable<NewsResponse> {
    const filter: NewsFilter = { categories: [category] };
    return this.getNews(filter, page);
  }

  /**
   * Search news articles
   */
  searchNews(query: string, page: number = 1): Observable<NewsResponse> {
    const filter: NewsFilter = { searchQuery: query };
    return this.getNews(filter, page);
  }

  /**
   * Apply filters to news articles
   */
  private applyFilters(articles: NewsArticle[], filter?: NewsFilter): NewsArticle[] {
    if (!filter) return articles;

    let filtered = [...articles];

    // Filter by categories
    if (filter.categories && filter.categories.length > 0) {
      filtered = filtered.filter(article =>
        filter.categories!.includes(article.category)
      );
    }

    // Filter by sources
    if (filter.sources && filter.sources.length > 0) {
      filtered = filtered.filter(article =>
        filter.sources!.includes(article.source.id)
      );
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.titleTranslated?.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.contentTranslated?.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (filter.dateFrom || filter.dateTo) {
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.publishedAt);
        const fromDate = filter.dateFrom ? new Date(filter.dateFrom) : new Date('1900-01-01');
        const toDate = filter.dateTo ? new Date(filter.dateTo) : new Date();

        return articleDate >= fromDate && articleDate <= toDate;
      });
    }

    return filtered;
  }

  /**
   * Get available news sources
   */
  getNewsSources(): Observable<NewsSource[]> {
    const rssSources = this.rssService.getAllRSSSources().map(feed => feed.source);
    return of([...this.mockSources, ...rssSources]);
  }

  /**
   * Mock data for development
   */
  private getMockNews(filter?: NewsFilter, page: number = 1, limit: number = 10): Observable<NewsResponse> {
    const mockArticles: NewsArticle[] = [
      {
        id: '1',
        title: 'Bundestag beschließt neue Klimaschutzmaßnahmen',
        titleTranslated: 'Bundestag passes new climate protection measures',
        content: 'Der Deutsche Bundestag hat heute mit großer Mehrheit ein umfassendes Paket neuer Klimaschutzmaßnahmen beschlossen...',
        contentTranslated: 'The German Bundestag today passed a comprehensive package of new climate protection measures with a large majority...',
        summary: 'German parliament approves comprehensive climate protection package with new emission targets and renewable energy incentives.',
        imageUrl: 'https://picsum.photos/400/300?random=1',
        source: this.mockSources[0],
        category: NewsCategory.POLITICS,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        url: 'https://example.com/news/1',
        author: 'Maria Schmidt',
        readTime: 3
      },
      {
        id: '2',
        title: 'Deutsche Wirtschaft zeigt robustes Wachstum',
        titleTranslated: 'German economy shows robust growth',
        content: 'Die deutsche Wirtschaft verzeichnet im dritten Quartal ein überraschend starkes Wachstum...',
        contentTranslated: 'The German economy recorded surprisingly strong growth in the third quarter...',
        summary: 'German GDP grows 2.1% in Q3, driven by strong exports and domestic consumption recovery.',
        imageUrl: 'https://picsum.photos/400/300?random=2',
        source: this.mockSources[1],
        category: NewsCategory.BUSINESS,
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        url: 'https://example.com/news/2',
        author: 'Thomas Weber',
        readTime: 2
      },
      {
        id: '3',
        title: 'Breakthrough in Quantencomputing an der TU München',
        titleTranslated: 'Quantum computing breakthrough at TU Munich',
        content: 'Wissenschaftler der Technischen Universität München haben einen bedeutenden Durchbruch...',
        contentTranslated: 'Scientists at the Technical University of Munich have achieved a significant breakthrough...',
        summary: 'TU Munich researchers develop new quantum processor with 100+ qubits, advancing quantum computing capabilities.',
        imageUrl: 'https://picsum.photos/400/300?random=3',
        source: this.mockSources[2],
        category: NewsCategory.TECHNOLOGY,
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        url: 'https://example.com/news/3',
        author: 'Dr. Andreas Klein',
        readTime: 4
      },
      {
        id: '4',
        title: 'Bayern München gewinnt Spitzenspiel gegen Dortmund',
        titleTranslated: 'Bayern Munich wins top match against Dortmund',
        content: 'In einem packenden Bundesliga-Spitzenspiel besiegte Bayern München...',
        contentTranslated: 'In an exciting Bundesliga top match, Bayern Munich defeated...',
        summary: 'Bayern Munich defeats Borussia Dortmund 3-1 in Der Klassiker, extending their lead at the top.',
        imageUrl: 'https://picsum.photos/400/300?random=4',
        source: this.mockSources[3],
        category: NewsCategory.SPORTS,
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        url: 'https://example.com/news/4',
        author: 'Stefan Müller',
        readTime: 2
      },
      {
        id: '5',
        title: 'Neue COVID-19-Variante in Europa entdeckt',
        titleTranslated: 'New COVID-19 variant discovered in Europe',
        content: 'Europäische Gesundheitsbehörden haben eine neue Variante des Coronavirus identifiziert...',
        contentTranslated: 'European health authorities have identified a new variant of the coronavirus...',
        summary: 'Health officials monitor new COVID variant with enhanced transmissibility but similar severity.',
        imageUrl: 'https://picsum.photos/400/300?random=5',
        source: this.mockSources[0],
        category: NewsCategory.HEALTH,
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        url: 'https://example.com/news/5',
        author: 'Dr. Julia Hoffmann',
        readTime: 3
      }
    ];

    // Apply filters if provided
    let filteredArticles = [...mockArticles];

    if (filter?.categories?.length) {
      filteredArticles = filteredArticles.filter(article =>
        filter.categories!.includes(article.category)
      );
    }

    if (filter?.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.titleTranslated?.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    return of({
      articles: paginatedArticles,
      totalResults: filteredArticles.length,
      hasMore: endIndex < filteredArticles.length,
      page
    });
  }

  /**
   * Set current page
   */
  setCurrentPage(page: number): void {
    this.currentPageSubject.next(page);
  }
}
