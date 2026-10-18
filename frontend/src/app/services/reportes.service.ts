// ============================================================================
// SERVICIO DE REPORTES ANALÍTICOS
// Archivo: src/app/services/reportes.service.ts
// ============================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout, catchError, of } from 'rxjs';
import { PlatoTop, VentaMensual } from '../models/restaurante.models';

export const VENTAS_DEMO: VentaMensual[] = [
  {
    anio: 2026,
    mes: 10,
    mes_anio: 'Octubre 2026',
    total_pedidos: 6,
    total_facturado: 135.5,
    ticket_promedio: 22.58,
  },
];

export const PLATOS_TOP_DEMO: PlatoTop[] = [
  {
    id_plato: 5,
    nombre_plato: 'Arroz Marinero Machaleño',
    categoria: 'Mariscos y Ceviches',
    precio_actual: 8.5,
    unidades_vendidas: 11,
    total_ingresos: 93.5,
  },
  {
    id_plato: 11,
    nombre_plato: 'Jugo Natural de Tamarindo (1L)',
    categoria: 'Bebidas y Jugos Naturales',
    precio_actual: 2.5,
    unidades_vendidas: 11,
    total_ingresos: 27.5,
  },
  {
    id_plato: 1,
    nombre_plato: 'Encebollado Mixto',
    categoria: 'Sopas y Caldos',
    precio_actual: 4.5,
    unidades_vendidas: 8,
    total_ingresos: 36.0,
  },
  {
    id_plato: 4,
    nombre_plato: 'Ceviche de Camarón',
    categoria: 'Mariscos y Ceviches',
    precio_actual: 6.5,
    unidades_vendidas: 7,
    total_ingresos: 45.5,
  },
  {
    id_plato: 7,
    nombre_plato: 'Seco de Pollo Criollo',
    categoria: 'Platos Fuertes Tradicionales',
    precio_actual: 4.75,
    unidades_vendidas: 6,
    total_ingresos: 28.5,
  },
];

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private readonly apiUrl = 'http://localhost:3000/api/reportes';

  constructor(private http: HttpClient) {}

  getVentasMensuales(): Observable<VentaMensual[]> {
    return this.http.get<{ ok: boolean; ventas: VentaMensual[] }>(`${this.apiUrl}/ventas-mensuales`).pipe(
      timeout(3000),
      map((res) => (res && res.ventas ? res.ventas : VENTAS_DEMO)),
      catchError((err) => {
        console.warn('Fallback a datos demo de ventas mensuales:', err);
        return of(VENTAS_DEMO);
      })
    );
  }

  getPlatosTop(limite: number = 10): Observable<PlatoTop[]> {
    return this.http.get<{ ok: boolean; platos: PlatoTop[] }>(`${this.apiUrl}/platos-top?limite=${limite}`).pipe(
      timeout(3000),
      map((res) => (res && res.platos ? res.platos : PLATOS_TOP_DEMO)),
      catchError((err) => {
        console.warn('Fallback a datos demo de platos top:', err);
        return of(PLATOS_TOP_DEMO);
      })
    );
  }
}
