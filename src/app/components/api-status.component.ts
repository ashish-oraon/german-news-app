import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RssCacheService } from '../services/rss-cache.service';
import { IndexedDBCacheService } from '../services/indexeddb-cache.service';
import { RSSService } from '../services/rss.service';

@Component({
  selector: 'app-api-status',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="api-status-card">
      <mat-card-content>
        <div class="status-row">
          <mat-icon class="status-icon success">verified</mat-icon>
          <span class="status-text">RSS2JSON API: Authenticated</span>
          <mat-chip class="status-chip success">PRO</mat-chip>
        </div>

        <div class="status-row" *ngIf="cacheStatus">
          <mat-icon class="status-icon">storage</mat-icon>
          <span class="status-text">
            IndexedDB: {{cacheStatus.totalArticles}} articles from {{cacheStatus.sources}} sources
          </span>
          <span class="cache-age">{{cacheStatus.cacheAge}} ({{cacheStatus.storageUsed}})</span>
        </div>

        <div class="status-row">
          <mat-icon class="status-icon">schedule</mat-icon>
          <span class="status-text">Next fetch: {{getNextFetchTime()}}</span>
        </div>

        <div class="status-row">
          <button
            mat-raised-button
            color="primary"
            (click)="refreshNews()"
            [disabled]="isRefreshing"
            class="refresh-button">
            <mat-spinner *ngIf="isRefreshing" diameter="16" class="refresh-spinner"></mat-spinner>
            <mat-icon *ngIf="!isRefreshing">refresh</mat-icon>
            {{ isRefreshing ? 'Refreshing...' : 'Refresh News' }}
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .api-status-card {
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%);
      border-left: 4px solid #4caf50;
    }

    .status-row {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
      gap: 0.5rem;
    }

    .status-row:last-child {
      margin-bottom: 0;
    }

    .status-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .status-icon.success {
      color: #4caf50;
    }

    .status-text {
      flex: 1;
      font-size: 14px;
    }

    .status-chip {
      font-size: 12px;
      height: 20px;
      padding: 0 8px;
    }

    .status-chip.success {
      background-color: #4caf50;
      color: white;
    }

    .cache-age {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }

    .refresh-button {
      margin-top: 0.5rem;
      font-size: 13px;
      height: 32px;
      width: 100%;
      border-radius: 6px;
    }

    .refresh-spinner {
      margin-right: 8px;
    }

    .refresh-button mat-icon {
      margin-right: 4px;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `]
})
export class ApiStatusComponent implements OnInit {
  @Output() newsRefreshed = new EventEmitter<void>();

  cacheStatus: any;
  isRefreshing = false;

  constructor(
    private cacheService: RssCacheService,
    private indexedDBCache: IndexedDBCacheService,
    private rssService: RSSService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.updateCacheStatus();

    // Update status when IndexedDB cache changes
    this.indexedDBCache.getCacheUpdates().subscribe(() => {
      this.updateCacheStatus();
    });
  }

  private updateCacheStatus(): void {
    this.indexedDBCache.getCacheStatus().subscribe(status => {
      this.cacheStatus = status;
    });
  }

  getNextFetchTime(): string {
    if (!this.cacheStatus) return 'Unknown';

    this.indexedDBCache.getTimeUntilNextFetch().subscribe(timeUntilNext => {
      if (timeUntilNext <= 0) {
        return 'Available now';
      }

      const minutes = Math.ceil(timeUntilNext / (60 * 1000));
      return `${minutes} minutes`;
    });

    return 'Checking...';
  }

  refreshNews(): void {
    if (this.isRefreshing) return;

    this.isRefreshing = true;

    this.snackBar.open('🔄 Clearing cache and fetching fresh news...', '', {
      duration: 2000,
      panelClass: ['snackbar-info']
    });

    this.rssService.refreshAllNews().subscribe({
      next: (articles) => {
        this.isRefreshing = false;
        this.updateCacheStatus(); // Update cache status display

        const message = articles.length > 0
          ? `✅ Successfully refreshed! ${articles.length} fresh articles loaded`
          : '⚠️ No new articles found, but cache has been cleared';

        this.snackBar.open(message, 'Close', {
          duration: 4000,
          panelClass: articles.length > 0 ? ['snackbar-success'] : ['snackbar-warning']
        });

        // Emit event to notify parent component to refresh the news list
        this.newsRefreshed.emit();
      },
      error: (error) => {
        this.isRefreshing = false;
        console.error('❌ Failed to refresh news:', error);

        this.snackBar.open('❌ Failed to refresh news. Please try again later.', 'Close', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }
}
