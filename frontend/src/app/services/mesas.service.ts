// ============================================================================
// SERVICIO DE MESAS
// Archivo: src/app/services/mesas.service.ts
// ============================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout, catchError, of } from 'rxjs';
import { Mesa } from '../models/restaurante.models';

export const MESAS_DEMO: Mesa[] = [
  { id_mesa: 1, numero: 1, capacidad: 2, estado: 'libre' },
  { id_mesa: 2, numero: 2, capacidad: 2, estado: 'ocupada' },
  { id_mesa: 3, numero: 3, capacidad: 4, estado: 'libre' },
  { id_mesa: 4, numero: 4, capacidad: 4, estado: 'ocupada' },
  { id_mesa: 5, numero: 5, capacidad: 4, estado: 'reservada' },
  { id_mesa: 6, numero: 6, capacidad: 6, estado: 'libre' },
  { id_mesa: 7, numero: 7, capacidad: 6, estado: 'ocupada' },
  { id_mesa: 8, numero: 8, capacidad: 8, estado: 'libre' },
  { id_mesa: 9, numero: 9, capacidad: 8, estado: 'reservada' },
  { id_mesa: 10, numero: 10, capacidad: 12, estado: 'libre' },
];

@Injectable({
  providedIn: 'root',
})
export class MesasService {
  private readonly apiUrl = 'http://localhost:3000/api/mesas';

  constructor(private http: HttpClient) {}

  getMesas(): Observable<Mesa[]> {
    return this.http.get<{ ok: boolean; mesas: Mesa[] }>(this.apiUrl).pipe(
      timeout(3000),
      map((res) => (res && res.mesas ? res.mesas : MESAS_DEMO)),
      catchError((err) => {
        console.warn('Fallback a mesas demo:', err);
        return of(MESAS_DEMO);
      })
    );
  }

  updateMesa(id: number, datos: Partial<Mesa>): Observable<Mesa> {
    return this.http.put<{ ok: boolean; mesa: Mesa }>(`${this.apiUrl}/${id}`, datos).pipe(
      map((res) => res.mesa)
    );
  }
}
