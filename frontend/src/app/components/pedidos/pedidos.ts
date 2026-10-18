import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosService, PEDIDOS_DEMO } from '../../services/pedidos.service';
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
export class PedidosComponent implements OnInit {
  private pedidosService = inject(PedidosService);
  public authService = inject(AuthService);

  pedidos: Pedido[] = PEDIDOS_DEMO;
  filtroEstado: string = '';
  cargando: boolean = false;
  pedidoSeleccionado: Pedido | null = null;
  mensajeExito: string = '';

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    if (this.pedidos.length === 0) {
      this.cargando = true;
    }
    this.pedidosService.getPedidos(this.filtroEstado || undefined).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.pedidos = data;
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando comandas:', err);
        this.cargando = false;
      },
    });
  }

  verDetallePedido(id: number): void {
    this.pedidosService.getPedidoById(id).subscribe({
      next: (data) => (this.pedidoSeleccionado = data),
      error: (err) => alert('Error al cargar detalle del pedido.'),
    });
  }

  cambiarEstado(idPedido: number, nuevoEstado: string): void {
    this.pedidosService.updateEstado(idPedido, nuevoEstado).subscribe({
      next: (res) => {
        this.mensajeExito = res.mensaje;
        setTimeout(() => (this.mensajeExito = ''), 3500);
        this.cargarPedidos();
        if (this.pedidoSeleccionado?.id_pedido === idPedido) {
          this.verDetallePedido(idPedido);
        }
      },
      error: (err) => alert(err.error?.mensaje || 'Error al cambiar estado.'),
    });
  }
}
