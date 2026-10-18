import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../services/carrito.service';
import { PedidosService } from '../../services/pedidos.service';
import { MesasService } from '../../services/mesas.service';
import { AuthService } from '../../services/auth.service';
import { Mesa } from '../../models/restaurante.models';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class CarritoComponent implements OnInit {
  public carritoService = inject(CarritoService);
  private pedidosService = inject(PedidosService);
  private mesasService = inject(MesasService);
  public authService = inject(AuthService);
  private router = inject(Router);

  mesas: Mesa[] = [];
  idMesaSeleccionada: number | null = null;
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';
  idPedidoCreado: number | null = null;

  ngOnInit(): void {
    this.cargarMesas();
  }

  cargarMesas(): void {
    if (this.authService.isLoggedIn()) {
      this.mesasService.getMesas().subscribe({
        next: (data) => (this.mesas = data),
        error: (err) => console.error('Error cargando mesas:', err),
      });
    }
  }

  confirmarPedido(): void {
    if (this.carritoService.items().length === 0) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.idMesaSeleccionada) {
      this.mensajeError = 'Por favor seleccione la mesa para asignar el pedido.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const payload = {
      id_mesa: Number(this.idMesaSeleccionada),
      id_cliente: 1, // Consumidor Final
      items: this.carritoService.items().map((item) => ({
        id_plato: item.plato.id_plato,
        cantidad: item.cantidad,
      })),
    };

    this.pedidosService.createPedido(payload).subscribe({
      next: (res) => {
        this.cargando = false;
        this.idPedidoCreado = res.id_pedido;
        this.mensajeExito = res.mensaje;
        this.carritoService.limpiarCarrito();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.mensaje || 'Error al procesar la comanda. Se aplicó ROLLBACK.';
      },
    });
  }
}
