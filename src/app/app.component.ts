import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header.component';
import { NewsFeedComponent } from './components/news-feed.component';
import { NewsCategory, NewsFilter } from './models/news.interface';

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
export class AppComponent {
  title = 'Deutsche News';

  @ViewChild('newsFeed') newsFeed!: NewsFeedComponent;

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
