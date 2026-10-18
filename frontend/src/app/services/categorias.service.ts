// ============================================================================
// SERVICIO DE CATEGORÍAS (HTTPCLIENT + FALLBACK)
// Archivo: src/app/services/categorias.service.ts
// ============================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { Categoria } from '../models/restaurante.models';

export const CATEGORIAS_DEMO: Categoria[] = [
  { id_categoria: 1, nombre: 'Desayunos Típicos', total_platos: 2 },
  { id_categoria: 2, nombre: 'Sopas y Caldos', total_platos: 2 },
  { id_categoria: 3, nombre: 'Mariscos y Ceviches', total_platos: 3 },
  { id_categoria: 4, nombre: 'Platos Fuertes Tradicionales', total_platos: 3 },
  { id_categoria: 5, nombre: 'Bebidas y Jugos Naturales', total_platos: 2 },
  { id_categoria: 6, nombre: 'Postres Criollos', total_platos: 0 },
];

@Injectable({
  providedIn: 'root',
})
export class CategoriasService {
  private readonly apiUrl = 'http://localhost:3000/api/categorias';

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<{ ok: boolean; categorias: Categoria[] }>(this.apiUrl).pipe(
      timeout(3000),
      map((res) => res.categorias),
      catchError(() => of(CATEGORIAS_DEMO))
    );
  }

  createCategoria(nombre: string): Observable<Categoria> {
    return this.http.post<{ ok: boolean; categoria: Categoria }>(this.apiUrl, { nombre }).pipe(
      map((res) => res.categoria)
    );
  }
}
