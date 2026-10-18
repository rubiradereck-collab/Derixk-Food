import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService } from '../../services/reservas.service';
import { MesasService } from '../../services/mesas.service';
import { AuthService } from '../../services/auth.service';
import { Mesa, Reserva } from '../../models/restaurante.models';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css',
})
export class ReservasComponent implements OnInit {
  private reservasService = inject(ReservasService);
  private mesasService = inject(MesasService);
  public authService = inject(AuthService);

  mesas: Mesa[] = [];
  reservas: Reserva[] = [];

  // Datos del formulario reactivo
  nombre: string = '';
  cedula: string = '';
  telefono: string = '';
  email: string = '';
  idMesa: number | null = null;
  fechaHora: string = '';
  numPersonas: number = 2;

  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  ngOnInit(): void {
    this.cargarMesas();
    if (this.authService.isLoggedIn()) {
      this.cargarReservas();
    }
  }

  cargarMesas(): void {
    this.mesasService.getMesas().subscribe({
      next: (data) => (this.mesas = data),
      error: (err) => console.error('Error cargando mesas:', err),
    });
  }

  cargarReservas(): void {
    this.reservasService.getReservas().subscribe({
      next: (data) => (this.reservas = data),
      error: (err) => console.error('Error cargando reservas:', err),
    });
  }

  crearReserva(): void {
    if (!this.nombre || !this.cedula || !this.idMesa || !this.fechaHora || !this.numPersonas) {
      this.mensajeError = 'Por favor complete todos los datos obligatorios de la reserva.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const payload = {
      nombre: this.nombre,
      cedula: this.cedula,
      telefono: this.telefono,
      email: this.email,
      id_mesa: Number(this.idMesa),
      fecha_hora: this.fechaHora.replace('T', ' ') + ':00',
      num_personas: Number(this.numPersonas),
    };

    this.reservasService.createReserva(payload).subscribe({
      next: (res) => {
        this.cargando = false;
        this.mensajeExito = res.mensaje || '¡Mesa reservada exitosamente!';
        this.limpiarFormulario();
        if (this.authService.isLoggedIn()) {
          this.cargarReservas();
        }
      },
      error: (err) => {
        this.cargando = false;
        // Muestra el mensaje del trigger de PostgreSQL si hubo conflicto en la ventana de 2 horas
        this.mensajeError = err.error?.mensaje || 'Error al agendar la reserva.';
      },
    });
  }

  cancelarReserva(idReserva: number): void {
    if (!confirm('¿Está seguro de cancelar esta reserva?')) return;

    this.reservasService.deleteReserva(idReserva).subscribe({
      next: () => this.cargarReservas(),
      error: (err) => alert(err.error?.mensaje || 'Error al cancelar reserva.'),
    });
  }

  limpiarFormulario(): void {
    this.nombre = '';
    this.cedula = '';
    this.telefono = '';
    this.email = '';
    this.idMesa = null;
    this.fechaHora = '';
    this.numPersonas = 2;
  }
}
