import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TranslationService } from '../services/translation.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-translation-status',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="translation-status-container">
      <div class="status-card" [class.api-active]="translationStatus.configured">
        <div class="status-header">
          <mat-icon class="status-icon" [class.active]="translationStatus.configured">
            {{ translationStatus.configured ? 'translate' : 'translate_off' }}
          </mat-icon>
          <div class="status-info">
            <h4>Translation Service</h4>
            <span class="service-name">{{ translationStatus.service }}</span>
          </div>
        </div>

        <div class="status-details">
          <div class="status-row">
            <span class="label">Status:</span>
            <span class="value" [class.active]="translationStatus.configured">
              {{ translationStatus.configured ? 'DeepL API Active' : 'Mock Mode' }}
            </span>
          </div>

          <div class="status-row" *ngIf="translationStatus.configured">
            <span class="label">Requests:</span>
            <span class="value">{{ translationStatus.requestCount }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <button
            mat-button
            (click)="testConnection()"
            [disabled]="testing"
            class="test-btn">
            <mat-spinner *ngIf="testing" diameter="16"></mat-spinner>
            <mat-icon *ngIf="!testing">wifi_tethering</mat-icon>
            {{ testing ? 'Testing...' : 'Test Connection' }}
          </button>
        </div>
      </div>

      <div class="setup-info" *ngIf="!translationStatus.configured">
        <p>📖 <strong>Setup Instructions:</strong></p>
        <ol>
          <li>Get your free DeepL API key from <a href="https://www.deepl.com/pro-api" target="_blank">deepl.com</a></li>
          <li>Open <code>src/app/services/translation.service.ts</code></li>
          <li>Replace <code>YOUR_DEEPL_API_KEY_HERE</code> with your actual key</li>
          <li>Refresh the page to activate professional translation</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .translation-status-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1000;
      max-width: 350px;
    }

    .status-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #ccc;
      transition: all 0.3s ease;
    }

    .status-card.api-active {
      border-left-color: #4caf50;
      background: linear-gradient(135deg, #f8fff8, #ffffff);
    }

    .status-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .status-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #999;
      transition: color 0.3s ease;
    }

    .status-icon.active {
      color: #4caf50;
    }

    .status-info h4 {
      margin: 0;
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }

    .service-name {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .status-details {
      margin-bottom: 12px;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
    }

    .label {
      color: #666;
    }

    .value {
      font-weight: 500;
      color: #333;
    }

    .value.active {
      color: #4caf50;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .test-btn {
      font-size: 11px;
      min-width: auto;
      padding: 4px 12px;
    }

    .setup-info {
      margin-top: 12px;
      background: #fff3cd;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      border: 1px solid #ffeeba;
    }

    .setup-info p {
      margin: 0 0 8px 0;
    }

    .setup-info ol {
      margin: 0;
      padding-left: 16px;
    }

    .setup-info li {
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .setup-info code {
      background: rgba(0, 0, 0, 0.1);
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 11px;
    }

    .setup-info a {
      color: #1976d2;
      text-decoration: none;
    }

    .setup-info a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .translation-status-container {
        position: relative;
        top: auto;
        right: auto;
        margin: 16px;
        max-width: none;
      }
    }
  `]
})
export class TranslationStatusComponent implements OnInit {
  translationStatus = {
    service: 'Loading...',
    configured: false,
    requestCount: 0
  };

  testing = false;

  constructor(
    private translationService: TranslationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.updateStatus();

    // Update status every 10 seconds
    setInterval(() => {
      this.updateStatus();
    }, 10000);
  }

  updateStatus(): void {
    this.translationStatus = this.translationService.getStatus();
  }

  testConnection(): void {
    if (!this.translationStatus.configured) {
      this.snackBar.open('DeepL API key not configured', 'Close', {
        duration: 3000
      });
      return;
    }

    this.testing = true;

    this.translationService.testConnection().subscribe({
      next: (success) => {
        this.testing = false;
        if (success) {
          this.snackBar.open('✅ DeepL API Connection Successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.snackBar.open('❌ DeepL API Test Failed', 'Check Key', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
        this.updateStatus();
      },
      error: () => {
        this.testing = false;
        this.snackBar.open('❌ Connection Error', 'Retry', {
          duration: 5000
        });
      }
    });
  }
}
