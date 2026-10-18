// ============================================================================
// SERVICIO DE PEDIDOS / COMANDAS
// Archivo: src/app/services/pedidos.service.ts
// ============================================================================
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, timeout, catchError, of } from 'rxjs';
import { Pedido } from '../models/restaurante.models';

export const PEDIDOS_DEMO: Pedido[] = [
  {
    id_pedido: 1,
    id_mesa: 2,
    numero_mesa: 2,
    id_cliente: 1,
    nombre_cliente: 'Consumidor Final',
    id_usuario: 2,
    mesero_responsable: 'Juan Carlos Pérez',
    fecha_hora: new Date().toISOString(),
    estado: 'en_cocina',
    total: 14.5,
    detalles: [
      {
        id_detalle: 1,
        id_plato: 1,
        nombre_plato: 'Encebollado Mixto',
        cantidad: 2,
        precio_unitario: 4.5,
        subtotal: 9.0,
      },
      {
        id_detalle: 2,
        id_plato: 11,
        nombre_plato: 'Jugo Natural de Tamarindo (1L)',
        cantidad: 1,
        precio_unitario: 2.5,
        subtotal: 2.5,
      },
    ],
  },
  {
    id_pedido: 2,
    id_mesa: 4,
    numero_mesa: 4,
    id_cliente: 2,
    nombre_cliente: 'Luis Fernando Torres',
    id_usuario: 2,
    mesero_responsable: 'Juan Carlos Pérez',
    fecha_hora: new Date().toISOString(),
    estado: 'servido',
    total: 21.5,
    detalles: [
      {
        id_detalle: 3,
        id_plato: 5,
        nombre_plato: 'Arroz Marinero Machaleño',
        cantidad: 2,
        precio_unitario: 8.5,
        subtotal: 17.0,
      },
      {
        id_detalle: 4,
        id_plato: 1,
        nombre_plato: 'Encebollado Mixto',
        cantidad: 1,
        precio_unitario: 4.5,
        subtotal: 4.5,
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly apiUrl = 'http://localhost:3000/api/pedidos';

  constructor(private http: HttpClient) {}

  getPedidos(estado?: string, mesa?: number): Observable<Pedido[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (mesa) params = params.set('mesa', mesa.toString());

    return this.http
      .get<{ ok: boolean; pedidos: Pedido[] }>(this.apiUrl, { params })
      .pipe(
        timeout(3000),
        map((res) => (res && res.pedidos ? res.pedidos : PEDIDOS_DEMO)),
        catchError((err) => {
          console.warn('Fallback a comandas demo:', err);
          return of(PEDIDOS_DEMO);
        })
      );
  }

  getPedidoById(id: number): Observable<Pedido> {
    return this.http.get<{ ok: boolean; pedido: Pedido }>(`${this.apiUrl}/${id}`).pipe(
      timeout(3000),
      map((res) => res.pedido),
      catchError(() => of(PEDIDOS_DEMO[0]))
    );
  }

  createPedido(data: {
    id_mesa: number;
    id_cliente?: number;
    items: { id_plato: number; cantidad: number }[];
  }): Observable<{ ok: boolean; mensaje: string; id_pedido: number; total: number }> {
    return this.http.post<{ ok: boolean; mensaje: string; id_pedido: number; total: number }>(
      this.apiUrl,
      data
    );
  }

  updateEstado(
    id: number,
    estado: string
  ): Observable<{ ok: boolean; mensaje: string; pedido?: Pedido }> {
    return this.http.put<{ ok: boolean; mensaje: string; pedido?: Pedido }>(
      `${this.apiUrl}/${id}/estado`,
      { estado }
    );
  }
}
