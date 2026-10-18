// ============================================================================
// PIPE PERSONALIZADO: ESTADO DE PEDIDO
// Archivo: src/app/pipes/estado-pedido.pipe.ts
// Transforma códigos de estado de base de datos en etiquetas legibles y descriptivas
// ============================================================================
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoPedido',
  standalone: true,
})
export class EstadoPedidoPipe implements PipeTransform {
  transform(valor: string | undefined): string {
    if (!valor) return 'Desconocido';

    switch (valor.toLowerCase()) {
      case 'pendiente':
        return 'En Espera ⏳';
      case 'en_cocina':
        return 'En Cocina 👨‍🍳';
      case 'listo':
        return 'Listo para Servir 🍽️';
      case 'servido':
        return 'Servido en Mesa ✅';
      case 'pagado':
        return 'Pagado y Cerrado 💵';
      case 'cancelado':
        return 'Cancelado ❌';
      default:
        return valor;
    }
  }
}
