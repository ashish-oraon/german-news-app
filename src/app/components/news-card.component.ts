import { Component, Input, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NewsArticle } from '../models/news.interface';
import { RSSService } from '../services/rss.service';

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="news-card" [class.expanded]="isExpanded">
      <div class="card-header">
        <div class="source-info">
          <img
            [src]="article.source.logoUrl || '/assets/icons/news-placeholder.svg'"
            [alt]="article.source.name"
            class="source-logo"
            onerror="this.src='/assets/icons/news-placeholder.svg'"
          >
          <span class="source-name">{{ article.source.name }}</span>
          <span class="publish-time">{{ getTimeAgo() }}</span>
        </div>
        <div class="category-chip">
          <mat-chip [style.background-color]="getCategoryColor()">
            {{ article.category }}
          </mat-chip>
        </div>
      </div>

      <div class="card-image" *ngIf="article.imageUrl">
        <img
          [src]="article.imageUrl"
          [alt]="article.titleTranslated || article.title"
          loading="lazy"
          onerror="this.style.display='none'"
        >
      </div>

      <mat-card-content class="card-content">
        <h2 class="news-title">
          {{ article.titleTranslated || article.title }}
          <span class="translation-badge" *ngIf="article.titleTranslated && showTranslationBadge">
            <mat-icon class="translate-icon">translate</mat-icon>
            EN
          </span>
        </h2>
        <p class="news-summary" [class.expanded]="isExpanded">
          {{ article.summary || (article.contentTranslated || article.content).substring(0, SUMMARY_MAX_LENGTH) + '...' }}
        </p>

        <div class="full-content" *ngIf="isExpanded">
          <!-- Translation Status -->
          <div class="translation-status" *ngIf="article.titleTranslated || article.contentTranslated">
            <mat-icon class="translation-status-icon">translate</mat-icon>
            <span class="translation-status-text">
              {{ getTranslationStatusText() }}
            </span>
          </div>

          <p class="translated-content">
            {{ article.contentTranslated || article.content }}
          </p>

          <div class="original-language" *ngIf="article.contentTranslated && showOriginalText">
            <div class="original-header">
              <h4>Original German Text:</h4>
              <button mat-button class="toggle-original-btn" (click)="toggleOriginalText()">
                <mat-icon>{{ showOriginalText ? 'visibility_off' : 'visibility' }}</mat-icon>
                {{ showOriginalText ? 'Hide' : 'Show' }}
              </button>
            </div>
            <div class="original-content-wrapper" [class.collapsed]="!showOriginalText">
              <p class="original-content">{{ article.content }}</p>
            </div>
          </div>
        </div>
      </mat-card-content>

      <mat-card-actions class="card-actions">
        <button
          mat-button
          (click)="toggleExpanded()"
          class="expand-btn"
        >
          <mat-icon>{{ isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
          {{ isExpanded ? 'Less' : 'More' }}
        </button>

        <button
          mat-button
          (click)="translateArticle()"
          [class]="getTranslateButtonClass()"
          [disabled]="isTranslating"
        >
          <mat-spinner *ngIf="isTranslating" diameter="16"></mat-spinner>
          <mat-icon *ngIf="!isTranslating">translate</mat-icon>
          {{ getTranslateButtonText() }}
        </button>

        <button
          mat-button
          (click)="openOriginal()"
          class="source-btn"
        >
          <mat-icon>open_in_new</mat-icon>
          Read Original
        </button>

        <button
          mat-icon-button
          (click)="shareArticle()"
          class="share-btn"
        >
          <mat-icon>share</mat-icon>
        </button>

        <button
          mat-icon-button
          (click)="bookmarkArticle()"
          [class.bookmarked]="isBookmarked"
        >
          <mat-icon>{{ isBookmarked ? 'bookmark' : 'bookmark_border' }}</mat-icon>
        </button>
      </mat-card-actions>

      <div class="reading-info" *ngIf="article.readTime">
        <mat-icon class="clock-icon">access_time</mat-icon>
        <span>{{ article.readTime }} min read</span>
      </div>
    </mat-card>
  `,
  styles: [`
    .news-card {
      margin: 16px;
      max-width: 600px;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .news-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 16px 8px 16px;
    }

    .source-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .source-logo {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .source-name {
      font-weight: 500;
      font-size: 14px;
      color: #666;
    }

    .publish-time {
      font-size: 12px;
      color: #999;
    }

    .category-chip {
      mat-chip {
        font-size: 12px;
        color: white;
        font-weight: 500;
      }
    }

    .card-image {
      width: 100%;
      height: 200px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
    }

    .news-card:hover .card-image img {
      transform: scale(1.05);
    }

    .card-content {
      padding: 16px !important;
    }

    .news-title {
      font-size: 20px;
      font-weight: 600;
      line-height: 1.4;
      margin: 0 0 12px 0;
      color: #333;
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .translation-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #2196f3;
      color: white;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

    .translate-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .news-summary {
      font-size: 16px;
      line-height: 1.6;
      color: #666;
      margin: 0 0 16px 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .news-summary.expanded {
      display: block;
      -webkit-line-clamp: none;
    }

    .full-content {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }

    .translation-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #1976d2;
      font-weight: 500;
    }

    .translation-status-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .translated-content {
      font-size: 16px;
      line-height: 1.6;
      color: #444;
      margin-bottom: 16px;
    }

    .original-language {
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin-top: 16px;
      border-left: 4px solid #1976d2;
    }

    .original-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      h4 {
        margin: 0;
        font-size: 14px;
        color: #666;
        font-weight: 500;
      }
    }

    .toggle-original-btn {
      min-width: auto;
      padding: 4px 8px;
      font-size: 12px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .original-content-wrapper {
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .original-content-wrapper.collapsed {
      max-height: 0;
      opacity: 0;
    }

    .original-content {
      font-size: 14px;
      line-height: 1.5;
      color: #666;
      margin: 0;
      font-style: italic;
      padding: 8px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 4px;
    }

    .card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px 16px 16px !important;
    }

    .expand-btn, .source-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .share-btn, .bookmarked {
      color: #1976d2;
    }

    .translate-btn {
      color: #4caf50;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: color 0.3s ease;
    }

    .translate-btn.new {
      color: #4caf50; /* Green for new translation */
    }

    .translate-btn.complete {
      color: #ff9800; /* Orange for completing partial translation */
    }

    .translate-btn.retranslate {
      color: #2196f3; /* Blue for retranslation */
    }

    .translate-btn[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .translate-btn mat-spinner {
      margin-right: 4px;
    }

    .bookmarked {
      color: #ff9800 !important;
    }

    .reading-info {
      position: absolute;
      bottom: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #999;
      background: rgba(255, 255, 255, 0.9);
      padding: 4px 8px;
      border-radius: 12px;
      backdrop-filter: blur(4px);
    }

    .clock-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .news-card.expanded {
      max-height: none;
    }

    @media (max-width: 768px) {
      .news-card {
        margin: 8px;
        border-radius: 12px;
      }

      .news-title {
        font-size: 18px;
      }

      .news-summary {
        font-size: 14px;
      }

      .card-image {
        height: 180px;
      }
    }
  `]
})
export class NewsCardComponent {
  @Input() article!: NewsArticle;

  // Constants
  readonly SUMMARY_MAX_LENGTH = 350;

  isExpanded = false;
  isBookmarked = false;
  showTranslationBadge = true;
  showOriginalText = false;
  isTranslating = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private rssService: RSSService
  ) {}

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  translateArticle(): void {
    if (this.isTranslating) {
      return;
    }

    this.isTranslating = true;
    const isRetranslation = this.article.titleTranslated && this.article.contentTranslated;
    console.log(isRetranslation ? '🔄 User requested retranslation for:' : '🔄 User requested translation for:',
                this.article.title.substring(0, 50) + '...');

    this.rssService.translateArticleOnDemand(this.article).subscribe({
      next: (translatedArticle) => {
        // Update the article with translations
        this.article.titleTranslated = translatedArticle.titleTranslated;
        this.article.contentTranslated = translatedArticle.contentTranslated;
        this.article.summary = translatedArticle.summary;

        this.isTranslating = false;
        console.log('✅ Translation completed successfully');
      },
      error: (error) => {
        console.error('❌ Translation failed:', error);
        this.isTranslating = false;
      }
    });
  }

  openOriginal(): void {
    if (isPlatformBrowser(this.platformId) && this.article.url) {
      window.open(this.article.url, '_blank', 'noopener,noreferrer');
    }
  }

  shareArticle(): void {
    if (isPlatformBrowser(this.platformId) && typeof navigator !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: this.article.titleTranslated || this.article.title,
          text: this.article.summary,
          url: this.article.url
        });
      } else if (navigator.clipboard) {
        // Fallback to clipboard
        const shareText = `${this.article.titleTranslated || this.article.title}\n${this.article.url}`;
        navigator.clipboard.writeText(shareText).then(() => {
          console.log('Article copied to clipboard');
        });
      }
    }
  }

  bookmarkArticle(): void {
    this.isBookmarked = !this.isBookmarked;
    // TODO: Implement bookmark service
    console.log('Bookmark toggled:', this.isBookmarked);
  }


  getCategoryColor(): string {
    const colors: { [key: string]: string } = {
      'Politik': '#e91e63',
      'Wirtschaft': '#2196f3',
      'Technologie': '#9c27b0',
      'Sport': '#4caf50',
      'Unterhaltung': '#ff9800',
      'Wissenschaft': '#00bcd4',
      'Gesundheit': '#8bc34a',
      'Welt': '#607d8b',
      'Deutschland': '#f44336',
      'Meinung': '#795548'
    };
    return colors[this.article.category] || '#666';
  }

  getTimeAgo(): string {
    const now = new Date();
    const published = new Date(this.article.publishedAt);
    const diffMs = now.getTime() - published.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  }

  getTranslationStatusText(): string {
    if (this.article.titleTranslated && this.article.contentTranslated) {
      return 'Translated from German by DeepL';
    } else if (this.article.titleTranslated) {
      return 'Title translated from German';
    } else if (this.article.contentTranslated) {
      return 'Content translated from German';
    }
    return 'Original German text';
  }

  getTranslateButtonText(): string {
    if (this.isTranslating) {
      return 'Translating...';
    }

    if (this.article.titleTranslated && this.article.contentTranslated) {
      return 'Retranslate';
    } else if (this.article.titleTranslated || this.article.contentTranslated) {
      return 'Complete Translation';
    }

    return 'Translate';
  }

  getTranslateButtonClass(): string {
    let baseClasses = 'translate-btn';

    if (this.article.titleTranslated && this.article.contentTranslated) {
      return `${baseClasses} retranslate`;
    } else if (this.article.titleTranslated || this.article.contentTranslated) {
      return `${baseClasses} complete`;
    }

    return `${baseClasses} new`;
  }

  toggleOriginalText(): void {
    this.showOriginalText = !this.showOriginalText;
  }
}
