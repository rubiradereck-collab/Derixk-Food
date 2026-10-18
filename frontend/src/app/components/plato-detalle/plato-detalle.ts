import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlatosService } from '../../services/platos.service';
import { CarritoService } from '../../services/carrito.service';
import { Plato } from '../../models/restaurante.models';

@Component({
  selector: 'app-plato-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, UpperCasePipe],
  templateUrl: './plato-detalle.html',
  styleUrl: './plato-detalle.css',
})
export class PlatoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platosService = inject(PlatosService);
  private carritoService = inject(CarritoService);

  plato: Plato | null = null;
  cargando: boolean = true;
  cantidad: number = 1;
  notificacion: string = '';

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = Number(params['id']);
      if (id) {
        this.cargarPlato(id);
      }
    });
  }

  cargarPlato(id: number): void {
    this.cargando = true;
    this.platosService.getPlatoById(id).subscribe({
      next: (data) => {
        this.plato = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar plato:', err);
        this.cargando = false;
      },
    });
  }

  incrementar(): void {
    if (this.plato && this.cantidad < this.plato.stock) {
      this.cantidad++;
    }
  }

  decrementar(): void {
    if (this.cantidad > 1) {
      this.cantidad--;
    }
  }

  agregarAlCarrito(): void {
    if (!this.plato || this.plato.stock <= 0) return;

    this.carritoService.agregarPlato(this.plato, this.cantidad);
    this.notificacion = `¡${this.cantidad} porción(es) de "${this.plato.nombre}" agregada(s) a la orden!`;
    setTimeout(() => (this.notificacion = ''), 3000);
  }

  regresar(): void {
    this.router.navigate(['/menu']);
  }
}
