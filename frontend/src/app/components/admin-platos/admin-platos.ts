import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatosService, PLATOS_DEMO } from '../../services/platos.service';
import { CategoriasService, CATEGORIAS_DEMO } from '../../services/categorias.service';
import { Categoria, Plato } from '../../models/restaurante.models';

@Component({
  selector: 'app-admin-platos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './admin-platos.html',
  styleUrl: './admin-platos.css',
})
export class AdminPlatosComponent implements OnInit {
  private platosService = inject(PlatosService);
  private categoriasService = inject(CategoriasService);

  platos: Plato[] = PLATOS_DEMO;
  categorias: Categoria[] = CATEGORIAS_DEMO;
  cargando: boolean = false;
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  // Formulario de edición/creación
  modoEdicion: boolean = false;
  idPlatoEditando: number | null = null;
  nombre: string = '';
  descripcion: string = '';
  precio: number = 0;
  stock: number = 10;
  disponible: boolean = true;
  idCategoria: number | null = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (this.platos.length === 0) {
      this.cargando = true;
    }
    this.categoriasService.getCategorias().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) this.categorias = cats;
      },
    });

    this.platosService.getPlatos().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.platos = data;
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando platos:', err);
        this.cargando = false;
      },
    });
  }

  iniciarNuevo(): void {
    this.modoEdicion = false;
    this.idPlatoEditando = null;
    this.nombre = '';
    this.descripcion = '';
    this.precio = 5.0;
    this.stock = 20;
    this.disponible = true;
    this.idCategoria = this.categorias.length > 0 ? this.categorias[0].id_categoria : null;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  editarPlato(p: Plato): void {
    this.modoEdicion = true;
    this.idPlatoEditando = p.id_plato;
    this.nombre = p.nombre;
    this.descripcion = p.descripcion;
    this.precio = p.precio;
    this.stock = p.stock;
    this.disponible = p.disponible;
    this.idCategoria = p.id_categoria;
    this.mensajeError = '';
    this.mensajeExito = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardarPlato(): void {
    if (!this.nombre || !this.idCategoria || this.precio <= 0) {
      this.mensajeError = 'Por favor complete todos los campos obligatorios con valores válidos.';
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const payload = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: Number(this.precio),
      stock: Number(this.stock),
      disponible: this.disponible,
      id_categoria: Number(this.idCategoria),
    };

    if (this.modoEdicion && this.idPlatoEditando) {
      // Al actualizar precio, el trigger trg_auditar_precio guardará el histórico en auditoria_precios
      this.platosService.updatePlato(this.idPlatoEditando, payload).subscribe({
        next: () => {
          this.guardando = false;
          this.mensajeExito = 'Plato actualizado exitosamente (cambio auditado en BD).';
          this.iniciarNuevo();
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando = false;
          this.mensajeError = err.error?.mensaje || 'Error al actualizar el plato.';
        },
      });
    } else {
      this.platosService.createPlato(payload).subscribe({
        next: () => {
          this.guardando = false;
          this.mensajeExito = 'Plato creado con éxito en la base de datos.';
          this.iniciarNuevo();
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando = false;
          this.mensajeError = err.error?.mensaje || 'Error al crear el plato.';
        },
      });
    }
  }

  eliminarPlato(p: Plato): void {
    if (!confirm(`¿Está seguro de eliminar el plato "${p.nombre}"?`)) return;

    this.platosService.deletePlato(p.id_plato).subscribe({
      next: (res) => {
        this.mensajeExito = res.mensaje;
        this.cargarDatos();
      },
      error: (err) => alert(err.error?.mensaje || 'Error al eliminar plato.'),
    });
  }
}
