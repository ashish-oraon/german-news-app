import { Component, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { NewsCategory } from '../models/news.interface';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <mat-toolbar class="header-toolbar" color="primary">
      <div class="toolbar-content">
        <!-- Logo and Title -->
        <div class="brand-section">
          <mat-icon class="app-icon">newspaper</mat-icon>
          <h1 class="app-title">Deutsche News</h1>
          <span class="app-subtitle">German News in English</span>
        </div>

        <!-- Search Bar -->
        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search news...</mat-label>
            <input
              matInput
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
              placeholder="Search for topics, keywords..."
            >
            <mat-icon matSuffix (click)="onSearch()" class="search-icon">search</mat-icon>
          </mat-form-field>
        </div>

        <!-- Menu Actions -->
        <div class="actions-section">
          <button mat-icon-button [matMenuTriggerFor]="settingsMenu">
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>
      </div>

      <!-- Category Navigation -->
      <div class="category-nav">
        <div class="category-chips">
          <mat-chip-listbox>
            <mat-chip-option
              *ngFor="let category of categories"
              (click)="onCategorySelect(category.value)"
              [selected]="selectedCategory === category.value"
              [style.background-color]="selectedCategory === category.value ? category.color : 'transparent'"
              [style.color]="selectedCategory === category.value ? 'white' : category.color"
            >
              <mat-icon>{{ category.icon }}</mat-icon>
              {{ category.label }}
            </mat-chip-option>
            <mat-chip-option
              (click)="onClearFilter()"
              [selected]="selectedCategory === null"
              class="clear-filter-chip"
            >
              <mat-icon>clear_all</mat-icon>
              All News
            </mat-chip-option>
          </mat-chip-listbox>
        </div>

        <button mat-icon-button class="scroll-left" (click)="scrollCategoriesLeft()">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <button mat-icon-button class="scroll-right" (click)="scrollCategoriesRight()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
    </mat-toolbar>

    <!-- Settings Menu -->
    <mat-menu #settingsMenu="matMenu">
      <button mat-menu-item (click)="toggleDarkMode()">
        <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
        <span>{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
      </button>
      <button mat-menu-item (click)="openAbout()">
        <mat-icon>info</mat-icon>
        <span>About</span>
      </button>
      <button mat-menu-item (click)="openSettings()">
        <mat-icon>settings</mat-icon>
        <span>Settings</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .header-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      flex-direction: column;
      align-items: stretch;
      padding: 0;
    }

    .toolbar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      min-height: 56px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .app-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .app-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      color: white;
    }

    .app-subtitle {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      font-style: italic;
    }

    .search-section {
      flex: 1;
      max-width: 400px;
      margin: 0 20px;
    }

    .search-field {
      width: 100%;

      .mat-mdc-form-field-wrapper {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 24px;
      }

      .mat-mdc-text-field-wrapper {
        background: transparent;
        border-radius: 24px;
      }

      .mat-mdc-form-field-label {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      input {
        color: white;
      }
    }

    .search-icon {
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
    }

    .search-icon:hover {
      color: white;
    }

    .actions-section {
      flex-shrink: 0;
    }

    .category-nav {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }

    .category-chips {
      flex: 1;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .category-chips::-webkit-scrollbar {
      display: none;
    }

    .mat-mdc-chip-listbox {
      display: flex;
      flex-wrap: nowrap;
      gap: 8px;
      padding: 0;
    }

    .mat-mdc-chip-option {
      display: flex;
      align-items: center;
      gap: 4px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      color: white;
      transition: all 0.3s ease;
      white-space: nowrap;
      font-size: 14px;
      padding: 8px 12px;
    }

    .mat-mdc-chip-option:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .mat-mdc-chip-option mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .clear-filter-chip {
      background: rgba(255, 255, 255, 0.2) !important;
      font-weight: 500;
    }

    .scroll-left, .scroll-right {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.5);
      color: white;
      z-index: 10;
    }

    .scroll-left {
      left: 0;
    }

    .scroll-right {
      right: 0;
    }

    @media (max-width: 768px) {
      .toolbar-content {
        flex-wrap: wrap;
        padding: 8px;
      }

      .brand-section {
        gap: 8px;
      }

      .app-title {
        font-size: 18px;
      }

      .app-subtitle {
        display: none;
      }

      .search-section {
        margin: 8px 0 0 0;
        max-width: none;
        width: 100%;
        order: 3;
      }

      .category-nav {
        padding: 8px;
      }
    }

    @media (max-width: 480px) {
      .brand-section .app-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .app-title {
        font-size: 16px;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() categorySelected = new EventEmitter<NewsCategory | null>();
  @Output() searchPerformed = new EventEmitter<string>();
  @Output() refreshRequested = new EventEmitter<void>();

  searchQuery = '';
  selectedCategory: NewsCategory | null = null;
  isDarkMode = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  categories = [
    { value: NewsCategory.POLITICS, label: 'Politics', icon: 'how_to_vote', color: '#e91e63' },
    { value: NewsCategory.BUSINESS, label: 'Business', icon: 'business', color: '#2196f3' },
    { value: NewsCategory.TECHNOLOGY, label: 'Tech', icon: 'computer', color: '#9c27b0' },
    { value: NewsCategory.SPORTS, label: 'Sports', icon: 'sports_soccer', color: '#4caf50' },
    { value: NewsCategory.ENTERTAINMENT, label: 'Entertainment', icon: 'movie', color: '#ff9800' },
    { value: NewsCategory.SCIENCE, label: 'Science', icon: 'science', color: '#00bcd4' },
    { value: NewsCategory.HEALTH, label: 'Health', icon: 'health_and_safety', color: '#8bc34a' },
    { value: NewsCategory.WORLD, label: 'World', icon: 'public', color: '#607d8b' },
    { value: NewsCategory.GERMANY, label: 'Germany', icon: 'flag', color: '#f44336' },
    { value: NewsCategory.OPINION, label: 'Opinion', icon: 'comment', color: '#795548' }
  ];

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.searchPerformed.emit(this.searchQuery.trim());
      this.selectedCategory = null;
    }
  }

  onCategorySelect(category: NewsCategory): void {
    this.selectedCategory = category;
    this.categorySelected.emit(category);
    this.searchQuery = '';
  }

  onClearFilter(): void {
    this.selectedCategory = null;
    this.searchQuery = '';
    this.categorySelected.emit(null);
  }

  scrollCategoriesLeft(): void {
    if (isPlatformBrowser(this.platformId)) {
      const container = this.document.querySelector('.category-chips');
      if (container) {
        container.scrollBy({ left: -200, behavior: 'smooth' });
      }
    }
  }

  scrollCategoriesRight(): void {
    if (isPlatformBrowser(this.platformId)) {
      const container = this.document.querySelector('.category-chips');
      if (container) {
        container.scrollBy({ left: 200, behavior: 'smooth' });
      }
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    // TODO: Implement dark mode toggle
    console.log('Dark mode toggled:', this.isDarkMode);
  }

  openAbout(): void {
    // TODO: Implement about dialog
    console.log('About clicked');
  }

  openSettings(): void {
    // TODO: Implement settings dialog
    console.log('Settings clicked');
  }
}
