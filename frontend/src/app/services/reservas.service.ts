// ============================================================================
// SERVICIO DE RESERVAS
// Archivo: src/app/services/reservas.service.ts
// ============================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout, catchError, of } from 'rxjs';
import { Reserva } from '../models/restaurante.models';

export const RESERVAS_DEMO: Reserva[] = [
  {
    id_reserva: 1,
    id_cliente: 2,
    nombre_cliente: 'Luis Fernando Torres',
    id_mesa: 5,
    numero_mesa: 5,
    fecha_hora: '2026-11-01T13:00:00Z',
    num_personas: 4,
    estado: 'confirmada',
  },
  {
    id_reserva: 2,
    id_cliente: 3,
    nombre_cliente: 'Patricia Viviana Solano',
    id_mesa: 9,
    numero_mesa: 9,
    fecha_hora: '2026-11-01T20:00:00Z',
    num_personas: 8,
    estado: 'confirmada',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private readonly apiUrl = 'http://localhost:3000/api/reservas';

  constructor(private http: HttpClient) {}

  getReservas(): Observable<Reserva[]> {
    return this.http.get<{ ok: boolean; reservas: Reserva[] }>(this.apiUrl).pipe(
      timeout(3000),
      map((res) => (res && res.reservas ? res.reservas : RESERVAS_DEMO)),
      catchError((err) => {
        console.warn('Fallback a reservas demo:', err);
        return of(RESERVAS_DEMO);
      })
    );
  }

  createReserva(datos: any): Observable<{ ok: boolean; mensaje: string; reserva: Reserva }> {
    return this.http.post<{ ok: boolean; mensaje: string; reserva: Reserva }>(this.apiUrl, datos);
  }

  deleteReserva(id: number): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.delete<{ ok: boolean; mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
