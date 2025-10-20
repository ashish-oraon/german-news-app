import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RssCacheService } from '../services/rss-cache.service';
import { IndexedDBCacheService } from '../services/indexeddb-cache.service';

@Component({
  selector: 'app-api-status',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
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
  `]
})
export class ApiStatusComponent implements OnInit {
  cacheStatus: any;

  constructor(
    private cacheService: RssCacheService,
    private indexedDBCache: IndexedDBCacheService
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
}
