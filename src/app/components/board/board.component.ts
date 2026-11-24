import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MediaService } from '../../services/media.service';
import { AuthService } from '../../services/auth.service';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass, FormsModule, SearchComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit {
  private mediaService = inject(MediaService);
  public authService = inject(AuthService); // 👈 Público para usarlo en board.component.html
  private router = inject(Router);

  library: any[] = [];
  loading = false; // 👈 Arranca en false para no trabar la vista de invitados
  activeTab: 'board' | 'stats' = 'board';
  typeFilter: 'all' | 'movie' | 'tv' = 'all';

  // Estado del Modal de Detalle
  selectedItem: any = null;
  detailData: any = null;
  loadingDetail = false;
  savingReview = false;
  editNotes = '';
  editRating: number | null = null;
  editFavorite = false;

  ngOnInit(): void {
    // Si tiene sesión iniciada, cargamos su biblioteca.
    // Si es invitado, no hace nada y solo se muestra <app-search> en el HTML.
    if (this.authService.isLoggedIn()) {
      this.loadLibrary();
    }
  }

  loadLibrary(): void {
    this.loading = true;
    this.mediaService.getLibrary().subscribe({
      next: (data) => {
        this.library = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.logout();
        }
      }
    });
  }

  // Filtrado por columna y tipo (Película / Serie / Todos)
  getItemsByStatus(status: string): any[] {
    return this.library.filter(item => {
      const matchesStatus = item.status === status;
      const matchesType = this.typeFilter === 'all' || item.media_item.media_type === this.typeFilter;
      return matchesStatus && matchesType;
    });
  }

  // Cambiar estado (pending -> watching -> finished)
  changeStatus(item: any, newStatus: string): void {
    this.mediaService.updateLibraryItem(item.id, { status: newStatus }).subscribe({
      next: (updated) => {
        item.status = updated.status;
      }
    });
  }

  // Cambiar prioridad (low, medium, high)
  changePriority(item: any, newPriority: string): void {
    this.mediaService.updateLibraryItem(item.id, { priority: newPriority }).subscribe({
      next: (updated) => {
        item.priority = updated.priority;
      }
    });
  }

  // Incrementar/decrementar episodio o temporada en series
  updateProgress(item: any, field: 'current_season' | 'current_episode', delta: number): void {
    const currentValue = item[field] || 1;
    const nextValue = Math.max(1, currentValue + delta);

    this.mediaService.updateLibraryItem(item.id, { [field]: nextValue }).subscribe({
      next: (updated) => {
        item[field] = updated[field];
      }
    });
  }

  // Eliminar del backlog
  deleteItem(id: number): void {
    if (!confirm('¿Seguro que querés eliminar este título de tu lista?')) {
      return;
    }

    this.mediaService.removeFromLibrary(id).subscribe({
      next: () => {
        this.library = this.library.filter(item => item.id !== id);
        if (this.selectedItem?.id === id) {
          this.closeModal();
        }
      }
    });
  }

  // --- MÉTODOS DEL MODAL DE DETALLE ---

  openDetailModal(item: any): void {
    this.selectedItem = item;
    this.detailData = null;
    this.loadingDetail = true;

    this.editNotes = item.review || '';
    this.editRating = item.personal_rating ?? null;
    this.editFavorite = !!item.is_favorite;

    const type = item.media_item.media_type;
    const tmdbId = item.media_item.tmdb_id;

    this.mediaService.getDetails(type, tmdbId, 'AR').subscribe({
      next: (details) => {
        this.detailData = details;
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
      }
    });
  }

  saveReview(): void {
    if (!this.selectedItem) return;
    this.savingReview = true;

    const ratingVal = this.editRating === null || this.editRating === 0 ? null : Number(this.editRating);

    const payload = {
      review: this.editNotes,
      personal_rating: ratingVal,
      is_favorite: this.editFavorite
    };

    this.mediaService.updateLibraryItem(this.selectedItem.id, payload).subscribe({
      next: (updated) => {
        this.selectedItem.review = updated.review;
        this.selectedItem.personal_rating = updated.personal_rating;
        this.selectedItem.is_favorite = updated.is_favorite;
        this.savingReview = false;
        this.closeModal();
      },
      error: () => {
        this.savingReview = false;
      }
    });
  }

  closeModal(): void {
    this.selectedItem = null;
    this.detailData = null;
  }

  logout(): void {
    this.authService.logout();
    this.library = []; // 👈 Limpiamos la lista en memoria sin expulsar al usuario a /login
  }

  // --- ESTADÍSTICAS ---

  get totalItems(): number {
    return this.library.length;
  }

  get completedMovies(): number {
    return this.library.filter(i => i.status === 'finished' && i.media_item.media_type === 'movie').length;
  }

  get completedSeries(): number {
    return this.library.filter(i => i.status === 'finished' && i.media_item.media_type === 'tv').length;
  }

  get favoriteItems(): any[] {
    return this.library.filter(i => i.is_favorite);
  }

  get averageRating(): string {
    const rated = this.library.filter(i => i.personal_rating !== null && i.personal_rating > 0);
    if (rated.length === 0) return '—';
    const sum = rated.reduce((acc, curr) => acc + curr.personal_rating, 0);
    return (sum / rated.length).toFixed(1);
  }

  get totalEpisodesWatched(): number {
    return this.library
      .filter(i => i.media_item.media_type === 'tv' && (i.status === 'watching' || i.status === 'finished'))
      .reduce((acc, curr) => acc + (curr.current_episode || 1), 0);
  }

  get completionRate(): number {
    if (this.totalItems === 0) return 0;
    const completedTotal = this.completedMovies + this.completedSeries;
    return Math.round((completedTotal / this.totalItems) * 100);
  }

  get topRatedItems(): any[] {
    return [...this.library]
      .filter(i => i.personal_rating !== null && i.personal_rating > 0)
      .sort((a, b) => b.personal_rating - a.personal_rating)
      .slice(0, 5);
  }
}