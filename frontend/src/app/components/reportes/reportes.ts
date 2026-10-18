import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ReportesService,
  PLATOS_TOP_DEMO,
  VENTAS_DEMO,
} from '../../services/reportes.service';
import { PlatoTop, VentaMensual } from '../../models/restaurante.models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class ReportesComponent implements OnInit {
  private reportesService = inject(ReportesService);

  platosTop: PlatoTop[] = PLATOS_TOP_DEMO;
  ventasMensuales: VentaMensual[] = VENTAS_DEMO;
  cargando: boolean = false;

  totalRecaudadoGeneral: number = 0;
  totalPedidosGeneral: number = 0;
  ticketPromedioGeneral: number = 0;

  ngOnInit(): void {
    this.calcularMetricas(this.ventasMensuales);
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.reportesService.getPlatosTop(10).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.platosTop = data;
        }
      },
      error: (err) => console.error('Error cargando platos top:', err),
    });

    this.reportesService.getVentasMensuales().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.ventasMensuales = data;
          this.calcularMetricas(data);
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando ventas mensuales:', err);
        this.cargando = false;
      },
    });
  }

  private calcularMetricas(ventas: VentaMensual[]): void {
    if (!Array.isArray(ventas) || ventas.length === 0) {
      this.totalRecaudadoGeneral = 0;
      this.totalPedidosGeneral = 0;
      this.ticketPromedioGeneral = 0;
      return;
    }

    try {
      this.totalRecaudadoGeneral = ventas.reduce(
        (acc, v) => acc + (Number(v.total_facturado) || 0),
        0
      );
      this.totalPedidosGeneral = ventas.reduce(
        (acc, v) => acc + (Number(v.total_pedidos) || 0),
        0
      );
      this.ticketPromedioGeneral =
        this.totalPedidosGeneral > 0
          ? this.totalRecaudadoGeneral / this.totalPedidosGeneral
          : 0;
    } catch (e) {
      console.warn('Error calculando métricas:', e);
    }
  }
}
