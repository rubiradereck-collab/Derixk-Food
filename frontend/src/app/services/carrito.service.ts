// ============================================================================
// SERVICIO DE CARRITO DE PEDIDO (SESSIONSTORAGE)
// Archivo: src/app/services/carrito.service.ts
// Gestión de estado temporal para comandas del comensal o mesero
// ============================================================================
import { Injectable, signal, computed } from '@angular/core';
import { ItemCarrito, Plato } from '../models/restaurante.models';

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private readonly storageKey = 'restaurante_carrito_comanda';

  // Señal reactiva con los ítems del carrito
  public items = signal<ItemCarrito[]>(this.cargarCarrito());

  // Métricas reactivas computadas
  public total = computed(() =>
    this.items().reduce((acum, item) => acum + item.subtotal, 0)
  );

  public cantidadTotal = computed(() =>
    this.items().reduce((acum, item) => acum + item.cantidad, 0)
  );

  constructor() {}

  private cargarCarrito(): ItemCarrito[] {
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private guardar(items: ItemCarrito[]): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(items));
    this.items.set([...items]);
  }

  agregarPlato(plato: Plato, cantidad: number = 1): void {
    const lista = this.cargarCarrito();
    const index = lista.findIndex((it) => it.plato.id_plato === plato.id_plato);

    if (index >= 0) {
      lista[index].cantidad += cantidad;
      lista[index].subtotal = lista[index].cantidad * plato.precio;
    } else {
      lista.push({
        plato,
        cantidad,
        subtotal: cantidad * plato.precio,
      });
    }

    this.guardar(lista);
  }

  cambiarCantidad(idPlato: number, cantidad: number): void {
    let lista = this.cargarCarrito();
    if (cantidad <= 0) {
      this.removerPlato(idPlato);
      return;
    }

    const index = lista.findIndex((it) => it.plato.id_plato === idPlato);
    if (index >= 0) {
      lista[index].cantidad = cantidad;
      lista[index].subtotal = cantidad * lista[index].plato.precio;
      this.guardar(lista);
    }
  }

  removerPlato(idPlato: number): void {
    const lista = this.cargarCarrito().filter((it) => it.plato.id_plato !== idPlato);
    this.guardar(lista);
  }

  limpiarCarrito(): void {
    sessionStorage.removeItem(this.storageKey);
    this.items.set([]);
  }
}
