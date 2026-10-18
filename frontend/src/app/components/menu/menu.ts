// ============================================================================
// COMPONENTE MENÚ POS - DERIXK FOOD
// Archivo: src/app/components/menu/menu.ts
// ============================================================================
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlatosService, PLATOS_DEMO } from '../../services/platos.service';
import { CategoriasService, CATEGORIAS_DEMO } from '../../services/categorias.service';
import { CarritoService } from '../../services/carrito.service';
import { MesasService } from '../../services/mesas.service';
import { PedidosService } from '../../services/pedidos.service';
import { AuthService } from '../../services/auth.service';
import { Categoria, Mesa, Plato } from '../../models/restaurante.models';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe, UpperCasePipe],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class MenuComponent implements OnInit {
  private platosService = inject(PlatosService);
  private categoriasService = inject(CategoriasService);
  public carritoService = inject(CarritoService);
  private mesasService = inject(MesasService);
  private pedidosService = inject(PedidosService);
  public authService = inject(AuthService);
  private router = inject(Router);

  platos: Plato[] = PLATOS_DEMO; // Carga inicial inmediata con fotos realistas
  categorias: Categoria[] = CATEGORIAS_DEMO;
  categoriaSeleccionada: number | undefined = undefined;
  textoBusqueda: string = '';
  cargando: boolean = false;
  notificacion: string = '';

  // Control de Comanda rápida (Panel derecho POS)
  mesas: Mesa[] = [];
  idMesaSeleccionada: number = 1;
  procesandoPedido: boolean = false;
  mensajeExitoComanda: string = '';
  mensajeErrorComanda: string = '';

  fechaHoy: Date = new Date();

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarPlatos();
    this.cargarMesas();
  }

  cargarCategorias(): void {
    this.categoriasService.getCategorias().subscribe({
      next: (data) => {
        if (data && data.length > 0) this.categorias = data;
      },
      error: () => (this.categorias = CATEGORIAS_DEMO),
    });
  }

  cargarPlatos(): void {
    this.cargando = true;
    this.platosService.getPlatos(this.categoriaSeleccionada, this.textoBusqueda).subscribe({
      next: (data) => {
        this.platos = data && data.length > 0 ? data : PLATOS_DEMO;
        this.cargando = false;
      },
      error: () => {
        this.platos = PLATOS_DEMO;
        this.cargando = false;
      },
    });
  }

  cargarMesas(): void {
    this.mesasService.getMesas().subscribe({
      next: (data) => (this.mesas = data),
      error: () => {
        // Fallback de mesas
        this.mesas = [
          { id_mesa: 1, numero: 1, capacidad: 2, estado: 'libre' },
          { id_mesa: 2, numero: 2, capacidad: 4, estado: 'libre' },
          { id_mesa: 3, numero: 3, capacidad: 4, estado: 'libre' },
          { id_mesa: 4, numero: 4, capacidad: 6, estado: 'libre' },
        ];
      },
    });
  }

  filtrarPorCategoria(idCategoria?: number): void {
    this.categoriaSeleccionada = idCategoria;
    this.cargarPlatos();
  }

  buscarPlatos(): void {
    this.cargarPlatos();
  }

  agregarAlCarrito(plato: Plato, event?: Event): void {
    if (event) event.stopPropagation();
    if (plato.stock <= 0) return;

    this.carritoService.agregarPlato(plato, 1);
    this.notificacion = `+1 ${plato.nombre}`;
    setTimeout(() => (this.notificacion = ''), 2000);
  }

  // Confirmar la orden directamente desde el panel POS
  confirmarComanda(): void {
    if (this.carritoService.items().length === 0) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.procesandoPedido = true;
    this.mensajeErrorComanda = '';
    this.mensajeExitoComanda = '';

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
        this.procesandoPedido = false;
        this.mensajeExitoComanda = `¡Comanda #${res.id_pedido} enviada a cocina!`;
        this.carritoService.limpiarCarrito();
        setTimeout(() => (this.mensajeExitoComanda = ''), 5000);
      },
      error: (err) => {
        this.procesandoPedido = false;
        this.mensajeErrorComanda = err.error?.mensaje || 'Error al procesar la comanda. Se aplicó ROLLBACK en BD.';
      },
    });
  }

  // Icono para cada categoría
  getIconoCategoria(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('desayuno')) return 'fa-solid fa-mug-hot';
    if (n.includes('sopa') || n.includes('caldo')) return 'fa-solid fa-bowl-food';
    if (n.includes('marisco') || n.includes('ceviche')) return 'fa-solid fa-fish';
    if (n.includes('fuerte') || n.includes('seco')) return 'fa-solid fa-drumstick-bite';
    if (n.includes('bebida') || n.includes('jugo')) return 'fa-solid fa-wine-glass';
    if (n.includes('postre')) return 'fa-solid fa-ice-cream';
    return 'fa-solid fa-utensils';
  }
}
