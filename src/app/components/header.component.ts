import { Component, Output, EventEmitter, Inject, PLATFORM_ID, OnInit } from '@angular/core';
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
import { InputSanitizerService } from '../services/input-sanitizer.service';

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
      box-shadow: 0 2px 8px var(--shadow-color);
      flex-direction: column;
      align-items: stretch;
      padding: 0;
      background-color: var(--bg-header) !important;
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
      color: var(--text-on-primary);
    }

    .app-subtitle {
      font-size: 12px;
      color: var(--text-on-primary);
      opacity: 0.7;
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
        background: var(--overlay-color);
        border-radius: 24px;
      }

      .mat-mdc-text-field-wrapper {
        background: transparent;
        border-radius: 24px;
      }

      .mat-mdc-form-field-label {
        color: var(--text-on-primary) !important;
        opacity: 0.7;
      }

      input {
        color: var(--text-on-primary);
      }
    }

    .search-icon {
      cursor: pointer;
      color: var(--text-on-primary);
      opacity: 0.7;
    }

    .search-icon:hover {
      color: var(--text-on-primary);
      opacity: 1;
    }

    .actions-section {
      flex-shrink: 0;
    }

    .category-nav {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background: var(--overlay-color);
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
      gap: 12px;
      padding: 0;
      align-items: center;
    }

    .mat-mdc-chip-option {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.85);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      font-size: 13px;
      font-weight: 400;
      padding: 10px 16px;
      border-radius: 20px;
      cursor: pointer;
      backdrop-filter: blur(8px);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }

    .mat-mdc-chip-option::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.6s ease;
    }

    .mat-mdc-chip-option:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px) scale(1.01);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      color: rgba(255, 255, 255, 0.95);
    }

    .mat-mdc-chip-option:hover::before {
      left: 100%;
    }

    .mat-mdc-chip-option:active {
      transform: translateY(0) scale(0.98);
    }

    .mat-mdc-chip-option[aria-selected="true"] {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
      font-weight: 500;
      box-shadow: 0 2px 10px rgba(255, 255, 255, 0.15);
    }

    .mat-mdc-chip-option[aria-selected="true"] mat-icon {
      color: white;
    }

    .mat-mdc-chip-option mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: inherit;
      transition: transform 0.3s ease;
    }

    .mat-mdc-chip-option:hover mat-icon {
      transform: scale(1.1);
    }

    .clear-filter-chip {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.18)) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      font-weight: 400 !important;
      position: relative;
    }

    .clear-filter-chip::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 22px;
      background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1));
      pointer-events: none;
    }

    .clear-filter-chip:hover {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.25)) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }

    /* Dark Theme Adjustments */
    [data-theme="dark"] .mat-mdc-chip-option {
      border-color: rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.85);
    }

    [data-theme="dark"] .mat-mdc-chip-option:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    [data-theme="dark"] .mat-mdc-chip-option[aria-selected="true"] {
      background: rgba(255, 255, 255, 0.95);
      color: var(--bg-primary);
      border-color: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
    }

    [data-theme="dark"] .clear-filter-chip {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.18)) !important;
      border-color: rgba(255, 255, 255, 0.25) !important;
    }

    [data-theme="dark"] .clear-filter-chip:hover {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.28)) !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
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
      .header-toolbar {
        overflow-x: hidden;
      }

      .toolbar-content {
        flex-wrap: wrap;
        padding: 8px;
        max-width: 100vw;
        overflow-x: hidden;
      }

      .brand-section {
        gap: 8px;
        flex-shrink: 0;
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

      .actions-section {
        flex-shrink: 0;
      }

      .category-nav {
        padding: 8px 4px;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .category-nav::-webkit-scrollbar {
        display: none;
      }

      .category-chips {
        padding: 0 4px;
      }

      .mat-mdc-chip-option {
        font-size: 12px;
        padding: 8px 12px;
        gap: 4px;
      }

      .mat-mdc-chip-option mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    @media (max-width: 480px) {
      .toolbar-content {
        padding: 4px;
      }

      .brand-section {
        gap: 6px;
      }

      .brand-section .app-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .app-title {
        font-size: 16px;
      }

      .search-section {
        margin: 6px 0 0 0;
      }

      .category-nav {
        padding: 6px 2px;
      }

      .category-chips mat-chip-listbox {
        gap: 8px;
      }

      .mat-mdc-chip-option {
        font-size: 11px;
        padding: 6px 10px;
        gap: 3px;
        border-radius: 20px;
      }

      .mat-mdc-chip-option mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }

      .scroll-left, .scroll-right {
        width: 32px;
        height: 32px;
        min-width: 32px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  @Output() categorySelected = new EventEmitter<NewsCategory | null>();
  @Output() searchPerformed = new EventEmitter<string>();
  @Output() refreshRequested = new EventEmitter<void>();

  searchQuery = '';
  selectedCategory: NewsCategory | null = null;
  isDarkMode = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private sanitizer: InputSanitizerService
  ) {}

  ngOnInit(): void {
    this.initializeTheme();
  }

  initializeTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      this.isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);

      const htmlElement = this.document.documentElement;
      if (this.isDarkMode) {
        htmlElement.setAttribute('data-theme', 'dark');
      } else {
        htmlElement.removeAttribute('data-theme');
      }
    }
  }

  categories = [
    { value: NewsCategory.POLITICS, label: 'Politics', icon: 'how_to_vote', color: '#8b5a5a' },
    { value: NewsCategory.BUSINESS, label: 'Business', icon: 'business', color: '#5a6b8b' },
    { value: NewsCategory.TECHNOLOGY, label: 'Tech', icon: 'computer', color: '#7a6b8b' },
    { value: NewsCategory.SPORTS, label: 'Sports', icon: 'sports_soccer', color: '#6b8b5a' },
    { value: NewsCategory.ENTERTAINMENT, label: 'Entertainment', icon: 'movie', color: '#8b6f5a' },
    { value: NewsCategory.SCIENCE, label: 'Science', icon: 'science', color: '#5a8b7a' },
    { value: NewsCategory.HEALTH, label: 'Health', icon: 'health_and_safety', color: '#7a8b5a' },
    { value: NewsCategory.WORLD, label: 'World', icon: 'public', color: '#6b6b6b' },
    { value: NewsCategory.GERMANY, label: 'Germany', icon: 'flag', color: '#8b5a6b' },
    { value: NewsCategory.OPINION, label: 'Opinion', icon: 'comment', color: '#8b7a5a' }
  ];

  onSearch(): void {
    if (this.searchQuery.trim()) {
      // Sanitize the search query to prevent XSS and injection attacks
      const sanitizedQuery = this.sanitizer.sanitizeSearchQuery(this.searchQuery.trim());

      if (sanitizedQuery) {
        this.searchPerformed.emit(sanitizedQuery);
        this.selectedCategory = null;

        // Update the input field with the sanitized query
        this.searchQuery = sanitizedQuery;
      } else {
        console.warn('🔒 Search query blocked due to potentially unsafe content');
        this.searchQuery = '';
      }
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

    if (isPlatformBrowser(this.platformId)) {
      const htmlElement = this.document.documentElement;
      if (this.isDarkMode) {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        htmlElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
      console.log('Theme switched to:', this.isDarkMode ? 'dark' : 'light');
    }
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
