import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Especialidad {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number;
  imagen: string;
  tiempo: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  especialidades: Especialidad[] = [
    {
      id: 99,
      nombre: 'Gran Banquete Criollo',
      categoria: 'Especialidad de la Casa',
      descripcion: 'Encebollado mixto con albacora, bolón de queso manaba, ceviche fresco, arroz marinero, patacones y ají.',
      precio: 14.5,
      imagen: 'assets/img/banquete-ecuatoriano.jpg',
      tiempo: '15-20 min',
    },
    {
      id: 1,
      nombre: 'Encebollado Mixto',
      categoria: 'Sopas y Caldos',
      descripcion: 'Albacora fresca, camarón del golfo, yuca suave, cebolla encurtida y chifles.',
      precio: 4.5,
      imagen: 'assets/img/encebollado-hero.jpg',
      tiempo: '10-15 min',
    },
    {
      id: 5,
      nombre: 'Arroz Marinero Machaleño',
      categoria: 'Mariscos y Ceviches',
      descripcion: 'Arroz salteado con camarón, calamar, concha prieta, cangrejo y vegetales.',
      precio: 8.5,
      imagen: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
      tiempo: '15-20 min',
    },
    {
      id: 2,
      nombre: 'Bolón Mixto Especial',
      categoria: 'Desayunos Típicos',
      descripcion: 'Masa de plátano verde con queso manaba, chicharrón crocante y café pasado.',
      precio: 3.0,
      imagen: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=1200&q=80',
      tiempo: '8-10 min',
    },
    {
      id: 4,
      nombre: 'Ceviche de Camarón',
      categoria: 'Mariscos y Ceviches',
      descripcion: 'Camarones marinados en cítricos con cebolla paiteña, cilantro y patacones.',
      precio: 6.5,
      imagen: 'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=1200&q=80',
      tiempo: '5-8 min',
    },
  ];

  indiceActual: number = 0;
  private intervaloTimer: any = null;

  ngOnInit(): void {
    this.iniciarCarrusel();
  }

  ngOnDestroy(): void {
    this.detenerCarrusel();
  }

  iniciarCarrusel(): void {
    this.detenerCarrusel();
    this.intervaloTimer = setInterval(() => {
      this.siguientePlato();
    }, 4500);
  }

  detenerCarrusel(): void {
    if (this.intervaloTimer) {
      clearInterval(this.intervaloTimer);
      this.intervaloTimer = null;
    }
  }

  seleccionarPlato(index: number): void {
    this.indiceActual = index;
    this.iniciarCarrusel();
  }

  siguientePlato(): void {
    this.indiceActual = (this.indiceActual + 1) % this.especialidades.length;
  }

  anteriorPlato(): void {
    this.indiceActual =
      this.indiceActual === 0 ? this.especialidades.length - 1 : this.indiceActual - 1;
    this.iniciarCarrusel();
  }

  platoFallback(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1000&q=80';
    }
  }
}