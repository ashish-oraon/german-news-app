import { Routes } from '@angular/router';
import { NewsFeedComponent } from './components/news-feed.component';

export const routes: Routes = [
  { path: '', component: NewsFeedComponent },
  { path: '**', redirectTo: '' }
];
