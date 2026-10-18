// ============================================================================
// MODELOS E INTERFACES TYPESCRIPT
// Archivo: src/app/models/restaurante.models.ts
// ============================================================================

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: 'administrador' | 'mesero' | 'cocina';
}

export interface AuthResponse {
  ok: boolean;
  mensaje: string;
  token: string;
  usuario: Usuario;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
  total_platos?: number;
}

export interface Plato {
  id_plato: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  stock: number;
  disponible: boolean;
  id_categoria: number;
  categoria?: string;
}

export interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'reservada';
  id_pedido_activo?: number;
}

export interface Reserva {
  id_reserva: number;
  id_cliente: number;
  id_mesa: number;
  fecha_hora: string;
  fecha_formateada?: string;
  num_personas: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  numero_mesa?: number;
  capacidad_mesa?: number;
  nombre_cliente?: string;
  cedula_cliente?: string;
  telefono_cliente?: string;
}

export interface ItemCarrito {
  plato: Plato;
  cantidad: number;
  subtotal: number;
}

export interface DetallePedido {
  id_detalle?: number;
  id_plato: number;
  nombre_plato?: string;
  imagen_plato?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id_pedido: number;
  id_cliente: number;
  id_mesa: number;
  id_usuario: number;
  fecha_hora: string;
  fecha_formateada?: string;
  estado: 'pendiente' | 'en_cocina' | 'listo' | 'servido' | 'pagado' | 'cancelado';
  total: number;
  numero_mesa?: number;
  nombre_cliente?: string;
  cedula_cliente?: string;
  mesero_responsable?: string;
  total_items?: number;
  detalles?: DetallePedido[];
}

export interface VentaMensual {
  anio: number;
  mes: number;
  mes_anio: string;
  total_pedidos: number;
  total_facturado: number;
  ticket_promedio: number;
}

export interface PlatoTop {
  id_plato: number;
  nombre_plato: string;
  categoria: string;
  precio_actual: number;
  unidades_vendidas: number;
  total_ingresos: number;
}
