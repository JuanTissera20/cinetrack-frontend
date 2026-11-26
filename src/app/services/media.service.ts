import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment.development';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // 1. Buscar películas o series en TMDb a través de Django
  searchTmdb(query: string, type: 'movie' | 'tv' = 'movie') {
    return this.http.get<any>(`${this.apiUrl}/search/?q=${encodeURIComponent(query)}&type=${type}`);
  }

  // 2. Obtener detalles y plataformas de streaming (AR por defecto)
  getDetails(type: 'movie' | 'tv', tmdbId: number, region: string = 'AR') {
    return this.http.get<any>(`${this.apiUrl}/detail/${type}/${tmdbId}/?region=${region}`);
  }

  // 3. Traer tu backlog personal desde MySQL
  getLibrary() {
    return this.http.get<any[]>(`${this.apiUrl}/library/`);
  }

  // 4. Agregar un título al backlog
  addToLibrary(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/library/`, payload);
  }

  // 5. Actualizar estado, prioridad, puntaje o episodio
  updateLibraryItem(id: number, data: any) {
    return this.http.patch<any>(`${this.apiUrl}/library/${id}/`, data);
  }

  // 6. Eliminar un título del backlog
  removeFromLibrary(id: number) {
    return this.http.delete(`${this.apiUrl}/library/${id}/`);
  }

  getTrending(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/trending/`);
}
}