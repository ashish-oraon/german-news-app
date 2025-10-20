import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rate-limit-message',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-card class="rate-limit-card">
      <mat-card-header>
        <div mat-card-avatar class="rate-limit-avatar">
          <mat-icon>schedule</mat-icon>
        </div>
        <mat-card-title>News Services Temporarily Busy</mat-card-title>
        <mat-card-subtitle>Real German news sources are rate-limited</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p>🇩🇪 The German RSS news sources (Spiegel, FAZ, Zeit, etc.) are currently experiencing high traffic.</p>

        <p><strong>⏰ Please check back in about an hour</strong> for the latest real German news with English translations.</p>

        <p>🔄 This happens when many people are accessing the news feeds simultaneously. Your patience helps us maintain access to quality journalism!</p>
      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-raised-button color="primary" (click)="refreshPage()">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .rate-limit-card {
      max-width: 600px;
      margin: 2rem auto;
      text-align: center;
    }

    .rate-limit-avatar {
      background-color: #ff9800;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    mat-card-content {
      padding: 1rem;
      line-height: 1.6;
    }

    mat-card-content p {
      margin-bottom: 1rem;
    }

    mat-card-actions {
      padding: 1rem;
    }
  `]
})
export class RateLimitMessageComponent {
  refreshPage(): void {
    window.location.reload();
  }
}
