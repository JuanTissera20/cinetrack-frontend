import { Component, EventEmitter, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaService } from '../../services/media.service';


@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  private mediaService = inject(MediaService);
  //Output() itemAdded = new EventEmitter<void>();
  // Evento para avisarle al tablero que se agregó una película nueva
  itemAdded = output<void>();

  query = '';
  mediaType: 'movie' | 'tv' = 'movie';
  results: any[] = [];
  loading = false;
  addedIds = new Set<number>();
  searching = false;

  onSearch() {
    if (!this.query.trim()) return;
    this.loading = true;
    this.searching = true;
    
    this.mediaService.searchTmdb(this.query, this.mediaType).subscribe({
      next: (res) => {
        this.results = res.results || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
  clearSearch(): void {
  this.query = '';
  this.results = [];
  }

  addingIds = new Set<number>();

  addToBacklog(item: any, status: string = 'pending'): void {
    this.addingIds.add(item.tmdb_id);

    this.mediaService.addToLibrary(item).subscribe({
    next: () => {
      this.addingIds.delete(item.tmdb_id);
      this.itemAdded.emit();
    },
    error: () => {
      this.addingIds.delete(item.tmdb_id);
    }
  })

    const payload = {
      tmdb_id: item.id,
      title: item.title || item.name,
      media_type: this.mediaType,
      release_date: item.release_date || item.first_air_date || null,
      poster_path: item.poster_path || null,
      overview: item.overview || '',
      vote_average: item.vote_average || 0,
      status: status,
      priority: 'medium'
    };

    this.mediaService.addToLibrary(payload).subscribe({
      next: () => {
        this.addedIds.add(item.id);
        this.itemAdded.emit();
      }
    });
  }
}