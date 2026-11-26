import { Component, OnInit, inject, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MediaService } from '../../services/media.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {
  private mediaService = inject(MediaService);
  private authService = inject(AuthService);

  loginRequired = output<void>();
  itemAdded = output<void>();

  query = '';
  mediaType: 'movie' | 'tv' = 'movie';
  results: any[] = [];
  isTrendingView = false;
  loading = false;
  searching = false;
  addingIds = new Set<number>();
  addedIds = new Set<number>();

  ngOnInit(): void {
    this.loadTrending();
  }

  loadTrending(): void {
    this.loading = true;
    this.searching = true;
    this.isTrendingView = true;

    this.mediaService.getTrending().subscribe({
      next: (res: any) => {
        this.results = Array.isArray(res) ? res : (res.results || []);
        this.loading = false;
        this.searching = false;
      },
      error: () => {
        this.loading = false;
        this.searching = false;
      }
    });
  }

  onSearch(): void {
    if (!this.query.trim()) {
      this.loadTrending();
      return;
    }

    this.loading = true;
    this.searching = true;
    this.isTrendingView = false;

    this.mediaService.searchTmdb(this.query, this.mediaType).subscribe({
      next: (res: any) => {
        this.results = Array.isArray(res) ? res : (res.results || []);
        this.loading = false;
        this.searching = false;
      },
      error: () => {
        this.loading = false;
        this.searching = false;
      }
    });
  }

  clearSearch(): void {
    this.query = '';
    this.loadTrending();
  }

  addToBacklog(item: any, status: string = 'pending'): void {
    if (!this.authService.isLoggedIn()) {
      this.loginRequired.emit();
      return;
    }

    const itemId = item.tmdb_id ?? item.id;
    this.addingIds.add(itemId);

    const payload = {
      tmdb_id: itemId,
      title: item.title || item.name,
      media_type: item.media_type || this.mediaType,
      release_date: item.release_date || item.first_air_date || null,
      poster_path: item.poster_path || null,
      overview: item.overview || '',
      vote_average: item.vote_average || 0,
      status: status,
      priority: 'medium'
    };

    this.mediaService.addToLibrary(payload).subscribe({
      next: () => {
        this.addingIds.delete(itemId);
        this.addedIds.add(itemId);
        this.itemAdded.emit();
      },
      error: () => {
        this.addingIds.delete(itemId);
      }
    });
  }
}