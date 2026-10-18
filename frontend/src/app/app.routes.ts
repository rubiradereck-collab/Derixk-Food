import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { MenuComponent } from './components/menu/menu';
import { PlatoDetalleComponent } from './components/plato-detalle/plato-detalle';
import { Login } from './components/login/login';
import { CarritoComponent } from './components/carrito/carrito';
import { ReservasComponent } from './components/reservas/reservas';
import { PedidosComponent } from './components/pedidos/pedidos';
import { AdminPlatosComponent } from './components/admin-platos/admin-platos';
import { ReportesComponent } from './components/reportes/reportes';
import { About } from './components/about/about';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  // 1. Acceso y autenticación (Primero)
  { path: 'login', component: Login },

  // 2. Vistas del restaurante
  { path: 'home', component: Home },
  { path: 'menu', component: MenuComponent },
  { path: 'plato/:id', component: PlatoDetalleComponent },
  { path: 'carrito', component: CarritoComponent },
  { path: 'reservas', component: ReservasComponent },
  { path: 'about', component: About },

  // 3. Monitor operativo de cocina (Personal autenticado)
  { path: 'pedidos', component: PedidosComponent, canActivate: [authGuard] },

  // 4. Administración y analítica exclusiva (RBAC: Administrador)
  {
    path: 'admin-platos',
    component: AdminPlatosComponent,
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
  },
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
  },

  // Redirección inicial: Iniciar sesión primero
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', pathMatch: 'full', redirectTo: 'home' },
];
