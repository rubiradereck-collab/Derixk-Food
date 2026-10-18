import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosService } from '../../services/pedidos.service';
import { AuthService } from '../../services/auth.service';
import { EstadoPedidoPipe } from '../../pipes/estado-pedido.pipe';
import { Pedido } from '../../models/restaurante.models';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, EstadoPedidoPipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class PedidosComponent implements OnInit, OnDestroy {
  private pedidosService = inject(PedidosService);
  public authService = inject(AuthService);

  pedidos: Pedido[] = [];
  filtroEstado: string = '';
  cargando: boolean = false;
  pedidoSeleccionado: Pedido | null = null;
  mensajeExito: string = '';
  mensajeError: string = '';

  private pollTimer: any = null;

  ngOnInit(): void {
    this.cargarPedidos(true);
    // Auto-refresco en vivo cada 8 segundos para cocina
    this.pollTimer = setInterval(() => {
      this.cargarPedidos(false);
    }, 8000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  cargarPedidos(mostrarSpinner: boolean = false): void {
    if (mostrarSpinner && this.pedidos.length === 0) {
      this.cargando = true;
    }
    this.pedidosService.getPedidos(this.filtroEstado || undefined).subscribe({
      next: (data) => {
        this.pedidos = data || [];
        this.cargando = false;
        this.mensajeError = '';
      },
      error: (err) => {
        console.error('Error cargando comandas de PostgreSQL:', err);
        this.cargando = false;
        if (err.status === 401 || err.status === 403) {
          this.mensajeError = 'Sesión no autorizada o expirada. Por favor inicie sesión como Administrador, Mesero o Cocina para gestionar comandas.';
        } else {
          this.mensajeError = 'No se pudo conectar con el servidor PostgreSQL. Verifique que el backend esté ejecutándose.';
        }
      },
    });
  }

  puede(...roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }

  verDetallePedido(id: number): void {
    this.pedidosService.getPedidoById(id).subscribe({
      next: (data) => (this.pedidoSeleccionado = data),
      error: (err) => console.error('Error al cargar detalle del pedido:', err),
    });
  }

  cambiarEstado(idPedido: number, nuevoEstado: string): void {
    this.mensajeError = '';
    this.pedidosService.updateEstado(idPedido, nuevoEstado).subscribe({
      next: (res) => {
        this.mensajeExito = res.mensaje;
        setTimeout(() => (this.mensajeExito = ''), 4000);
        this.cargarPedidos(false);
        if (this.pedidoSeleccionado?.id_pedido === idPedido) {
          this.verDetallePedido(idPedido);
        }
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al cambiar estado del pedido.';
        setTimeout(() => (this.mensajeError = ''), 5000);
      },
    });
  }
}
