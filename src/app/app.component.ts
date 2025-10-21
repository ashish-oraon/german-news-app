import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header.component';
import { NewsFeedComponent } from './components/news-feed.component';
import { NewsCategory, NewsFilter } from './models/news.interface';
import { PwaUpdateService } from './services/pwa-update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    NewsFeedComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Deutsche News';

  @ViewChild('newsFeed') newsFeed!: NewsFeedComponent;

  constructor(private pwaUpdateService: PwaUpdateService) {}

  ngOnInit(): void {
    // PWA update service is automatically initialized via dependency injection
    console.log('🚀 Deutsche News PWA initialized');

    if (this.pwaUpdateService.isStandalone()) {
      console.log('📱 Running as PWA in standalone mode');
    }
  }

  onCategorySelected(category: NewsCategory | null): void {
    if (category) {
      // Filter news by category
      this.newsFeed.filterByCategory(category);
    } else {
      // Show all news
      this.newsFeed.loadNews();
    }
  }

  onSearchPerformed(query: string): void {
    // Search news
    this.newsFeed.searchNews(query);
  }
}
