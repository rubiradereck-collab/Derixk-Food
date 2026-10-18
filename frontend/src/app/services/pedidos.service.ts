import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Pedido } from '../models/restaurante.models';
import { environment } from '../../environments/environment';

export const PEDIDOS_DEMO: Pedido[] = [];

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pedidos`;

  getPedidos(estado?: string): Observable<Pedido[]> {
    const params = estado ? new HttpParams().set('estado', estado) : undefined;
    return this.http
      .get<{ ok: boolean; pedidos: Pedido[] }>(this.apiUrl, { params })
      .pipe(map((res) => res.pedidos || []));
  }

  getPedidoById(id: number): Observable<Pedido> {
    return this.http
      .get<{ ok: boolean; pedido: Pedido }>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.pedido));
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

  updateEstado(id: number, estado: string): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.put<{ ok: boolean; mensaje: string }>(`${this.apiUrl}/${id}/estado`, { estado });
  }
}
