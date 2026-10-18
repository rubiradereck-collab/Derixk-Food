// ============================================================================
// SERVICIO DE PLATOS (HTTPCLIENT REST + FALLBACK INMEDIATO)
// Archivo: src/app/services/platos.service.ts
// ============================================================================
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { Plato } from '../models/restaurante.models';

export const PLATOS_DEMO: Plato[] = [
  {
    id_plato: 1,
    nombre: 'Encebollado Mixto',
    descripcion: 'Albacora fresca, camarón, yuca suave, cebolla paiteña encurtida y chifles crujientes.',
    precio: 4.50,
    imagen: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    stock: 35,
    disponible: true,
    id_categoria: 2,
    categoria: 'Sopas y Caldos',
  },
  {
    id_plato: 2,
    nombre: 'Bolón Mixto Especial',
    descripcion: 'Plátano verde majado con queso manaba criollo y chicharrón crocante, café pasado.',
    precio: 3.00,
    imagen: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
    stock: 50,
    disponible: true,
    id_categoria: 1,
    categoria: 'Desayunos Típicos',
  },
  {
    id_plato: 3,
    nombre: 'Tigrillo Zarumeño',
    descripcion: 'Verde majado con abundante queso, chicharrón de cerdo y huevo frito al gusto.',
    precio: 4.00,
    imagen: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    stock: 28,
    disponible: true,
    id_categoria: 1,
    categoria: 'Desayunos Típicos',
  },
  {
    id_plato: 4,
    nombre: 'Ceviche de Camarón',
    descripcion: 'Camarones del Golfo marinados en cítricos con cebolla, cilantro y toque de mostaza.',
    precio: 6.50,
    imagen: 'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=600&q=80',
    stock: 25,
    disponible: true,
    id_categoria: 3,
    categoria: 'Mariscos y Ceviches',
  },
  {
    id_plato: 5,
    nombre: 'Arroz Marinero Machaleño',
    descripcion: 'Arroz salteado con camarón, calamar, concha prieta, cangrejo y especias del puerto.',
    precio: 8.50,
    imagen: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    stock: 20,
    disponible: true,
    id_categoria: 3,
    categoria: 'Mariscos y Ceviches',
  },
  {
    id_plato: 6,
    nombre: 'Cazuela de Mariscos',
    descripcion: 'Masa de verde horneada con pasta de maní, pescado de roca y mariscos gratinados.',
    precio: 7.00,
    imagen: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    stock: 18,
    disponible: true,
    id_categoria: 3,
    categoria: 'Mariscos y Ceviches',
  },
  {
    id_plato: 7,
    nombre: 'Seco de Pollo Criollo',
    descripcion: 'Pollo cocinado a fuego lento con cerveza, naranjilla, servido con arroz y maduro frito.',
    precio: 4.75,
    imagen: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80',
    stock: 40,
    disponible: true,
    id_categoria: 4,
    categoria: 'Platos Fuertes Tradicionales',
  },
  {
    id_plato: 8,
    nombre: 'Guatita Ecuatoriana',
    descripcion: 'Mondongo tierno en cremosa salsa de maní con papas, aguacate y arroz blanco caliente.',
    precio: 4.25,
    imagen: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80',
    stock: 22,
    disponible: true,
    id_categoria: 4,
    categoria: 'Platos Fuertes Tradicionales',
  },
  {
    id_plato: 9,
    nombre: 'Caldo de Bola de Verde',
    descripcion: 'Sustanciosa sopa de res con bola de verde rellena de carne picada, huevo y verduras.',
    precio: 5.00,
    imagen: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
    stock: 15,
    disponible: true,
    id_categoria: 2,
    categoria: 'Sopas y Caldos',
  },
  {
    id_plato: 10,
    nombre: 'Corvina Frita con Patacones',
    descripcion: 'Pescado entero dorado y crujiente, servido con patacones de verde y ensalada.',
    precio: 7.50,
    imagen: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80',
    stock: 16,
    disponible: true,
    id_categoria: 4,
    categoria: 'Platos Fuertes Tradicionales',
  },
  {
    id_plato: 11,
    nombre: 'Jugo Natural de Tamarindo',
    descripcion: 'Bebida helada de tamarindo natural endulzada con panela orgánica (1 Litro).',
    precio: 2.50,
    imagen: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    stock: 60,
    disponible: true,
    id_categoria: 5,
    categoria: 'Bebidas y Jugos Naturales',
  },
  {
    id_plato: 12,
    nombre: 'Colada Morada Tradicional',
    descripcion: 'Receta ancestral con maíz morado, mortiño, mora, piña, babaco y especias dulces.',
    precio: 2.75,
    imagen: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80',
    stock: 30,
    disponible: true,
    id_categoria: 5,
    categoria: 'Bebidas y Jugos Naturales',
  },
];

@Injectable({
  providedIn: 'root',
})
export class PlatosService {
  private readonly apiUrl = 'http://localhost:3000/api/platos';

  constructor(private http: HttpClient) {}

  getPlatos(categoriaId?: number, busqueda?: string): Observable<Plato[]> {
    let params = new HttpParams();
    if (categoriaId) params = params.set('categoria', categoriaId.toString());
    if (busqueda) params = params.set('q', busqueda);

    return this.http.get<{ ok: boolean; platos: Plato[] }>(this.apiUrl, { params }).pipe(
      timeout(3000), // Si el backend no responde en 3s, salta al fallback
      map((res) => res.platos),
      catchError(() => {
        // Fallback inmediato: garantiza que la interfaz NUNCA se quede en carga infinita
        let filtrados = [...PLATOS_DEMO];
        if (categoriaId) {
          filtrados = filtrados.filter((p) => p.id_categoria === categoriaId);
        }
        if (busqueda) {
          const q = busqueda.toLowerCase();
          filtrados = filtrados.filter(
            (p) => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q)
          );
        }
        return of(filtrados);
      })
    );
  }

  getPlatoById(id: number): Observable<Plato> {
    return this.http.get<{ ok: boolean; plato: Plato }>(`${this.apiUrl}/${id}`).pipe(
      timeout(3000),
      map((res) => res.plato),
      catchError(() => {
        const encontrado = PLATOS_DEMO.find((p) => p.id_plato === id) || PLATOS_DEMO[0];
        return of(encontrado);
      })
    );
  }

  createPlato(plato: Partial<Plato>): Observable<Plato> {
    return this.http.post<{ ok: boolean; plato: Plato }>(this.apiUrl, plato).pipe(
      map((res) => res.plato)
    );
  }

  updatePlato(id: number, plato: Partial<Plato>): Observable<Plato> {
    return this.http.put<{ ok: boolean; plato: Plato }>(`${this.apiUrl}/${id}`, plato).pipe(
      map((res) => res.plato)
    );
  }

  deletePlato(id: number): Observable<{ ok: boolean; mensaje: string }> {
    return this.http.delete<{ ok: boolean; mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
