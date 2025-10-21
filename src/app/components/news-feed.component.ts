import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize } from 'rxjs';
import { NewsService } from '../services/news.service';
import { NewsArticle, NewsCategory, NewsFilter } from '../models/news.interface';
import { NewsCardComponent } from './news-card.component';
import { ApiStatusComponent } from './api-status.component';

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NewsCardComponent,
    ApiStatusComponent
  ],
  template: `
    <div class="news-feed-container">
      <!-- API Status Card -->
      <app-api-status (newsRefreshed)="refreshNews()"></app-api-status>

      <div class="news-feed" #newsFeed>
        <!-- Loading spinner for initial load -->
        <div class="loading-container" *ngIf="loading && articles.length === 0">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading latest news...</p>
        </div>

        <!-- Error state -->
        <div class="error-container" *ngIf="error && articles.length === 0">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>Unable to load news</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="loadNews()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>

        <!-- Empty state -->
        <div class="empty-container" *ngIf="!loading && articles.length === 0 && !error">
          <mat-icon class="empty-icon">article</mat-icon>
          <h3>No news found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>

        <!-- News articles -->
        <div class="articles-container" *ngIf="articles.length > 0">
          <app-news-card
            *ngFor="let article of articles; trackBy: trackByArticleId"
            [article]="article"
            class="article-item"
          ></app-news-card>
        </div>

        <!-- Load more indicator -->
        <div class="load-more-container" *ngIf="articles.length > 0 && !loading && hasMore">
          <button mat-raised-button (click)="loadMoreNews()" [disabled]="loadingMore">
            <mat-icon *ngIf="!loadingMore">expand_more</mat-icon>
            <mat-spinner *ngIf="loadingMore" diameter="20"></mat-spinner>
            {{ loadingMore ? 'Loading...' : 'Load More' }}
          </button>
        </div>

        <!-- End of feed -->
        <div class="end-of-feed" *ngIf="articles.length > 0 && !hasMore">
          <p>You've reached the end of the news feed</p>
          <button mat-button (click)="scrollToTop()">
            <mat-icon>keyboard_arrow_up</mat-icon>
            Back to Top
          </button>
        </div>

        <!-- Loading more spinner -->
        <div class="loading-more" *ngIf="loadingMore">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      </div>

      <!-- Refresh FAB -->
      <button
        mat-fab
        class="refresh-fab"
        (click)="refreshNews()"
        [disabled]="loading"
        *ngIf="articles.length > 0"
      >
        <mat-icon [class.spinning]="loading">refresh</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .news-feed-container {
      position: relative;
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .news-feed {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      box-sizing: border-box;
    }

    .articles-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .article-item {
      animation: fadeInUp 0.5s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .loading-container, .error-container, .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .error-icon, .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .error-container h3, .empty-container h3 {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .error-container p, .empty-container p {
      margin: 0 0 24px 0;
      color: #999;
    }

    .load-more-container {
      display: flex;
      justify-content: center;
      margin: 32px 0;
    }

    .end-of-feed {
      text-align: center;
      padding: 32px;
      color: #666;

      p {
        margin: 0 0 16px 0;
      }
    }

    .loading-more {
      display: flex;
      justify-content: center;
      padding: 20px;
    }

    .refresh-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
      background-color: #1976d2;
      color: white;
    }

    .refresh-fab:hover {
      background-color: #1565c0;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .news-feed {
        padding: 10px;
      }

      .refresh-fab {
        bottom: 16px;
        right: 16px;
      }
    }

    @media (max-width: 480px) {
      .loading-container, .error-container, .empty-container {
        padding: 40px 15px;
      }
    }
  `]
})
export class NewsFeedComponent implements OnInit, OnDestroy {
  articles: NewsArticle[] = [];
  loading = false;
  loadingMore = false;
  error: string | null = null;
  hasMore = true;
  currentPage = 1;
  currentFilter: NewsFilter = {};

  private destroy$ = new Subject<void>();

  constructor(
    private newsService: NewsService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.loadNews();
    this.setupInfiniteScroll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNews(filter?: NewsFilter): void {
    this.loading = true;
    this.error = null;
    this.currentPage = 1;
    this.currentFilter = filter || {};

    this.newsService.getNews(this.currentFilter, this.currentPage)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.articles = response.articles;
          this.hasMore = response.hasMore;
          this.currentPage = response.page;
        },
        error: (error) => {
          this.error = 'Failed to load news. Please try again.';
          console.error('News loading error:', error);
        }
      });
  }

  loadMoreNews(): void {
    if (this.loadingMore || !this.hasMore) return;

    this.loadingMore = true;
    const nextPage = this.currentPage + 1;

    this.newsService.getNews(this.currentFilter, nextPage)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingMore = false)
      )
      .subscribe({
        next: (response) => {
          this.articles = [...this.articles, ...response.articles];
          this.hasMore = response.hasMore;
          this.currentPage = nextPage;
        },
        error: (error) => {
          this.snackBar.open('Failed to load more news', 'Dismiss', {
            duration: 3000
          });
          console.error('Load more error:', error);
        }
      });
  }

  refreshNews(): void {
    if (this.loading) return;

    this.loadNews(this.currentFilter);
    this.snackBar.open('News refreshed', 'Dismiss', {
      duration: 2000
    });
  }

  filterByCategory(category: NewsCategory): void {
    const filter: NewsFilter = { categories: [category] };
    this.loadNews(filter);
  }

  searchNews(query: string): void {
    const filter: NewsFilter = { searchQuery: query };
    this.loadNews(filter);
  }

  trackByArticleId(index: number, article: NewsArticle): string {
    return article.id;
  }

  scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (isPlatformBrowser(this.platformId) && this.shouldLoadMore()) {
      this.loadMoreNews();
    }
  }

  private setupInfiniteScroll(): void {
    // Infinite scroll is handled by the @HostListener above
  }

  private shouldLoadMore(): boolean {
    if (this.loadingMore || !this.hasMore || !isPlatformBrowser(this.platformId)) return false;

    const threshold = 200;
    const position = window.innerHeight + window.pageYOffset;
    const height = this.document.body.offsetHeight;

    return position >= height - threshold;
  }
}
