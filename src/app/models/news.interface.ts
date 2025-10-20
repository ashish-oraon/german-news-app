export interface NewsArticle {
  id: string;
  title: string;
  titleTranslated?: string;
  content: string;
  contentTranslated?: string;
  summary?: string;
  imageUrl?: string;
  source: NewsSource;
  category: NewsCategory;
  publishedAt: Date;
  url: string;
  author?: string;
  readTime?: number; // estimated read time in minutes
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
  reliability: number; // 1-5 scale
}

export enum NewsCategory {
  POLITICS = 'Politik',
  BUSINESS = 'Wirtschaft',
  TECHNOLOGY = 'Technologie',
  SPORTS = 'Sport',
  ENTERTAINMENT = 'Unterhaltung',
  SCIENCE = 'Wissenschaft',
  HEALTH = 'Gesundheit',
  WORLD = 'Welt',
  GERMANY = 'Deutschland',
  OPINION = 'Meinung'
}

export interface NewsFilter {
  categories?: NewsCategory[];
  sources?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  hasMore: boolean;
  page: number;
}
