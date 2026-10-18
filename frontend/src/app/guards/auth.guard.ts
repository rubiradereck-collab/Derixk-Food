// ============================================================================
// GUARDS DE PROTECCIÓN DE RUTAS
// Archivo: src/app/guards/auth.guard.ts
// ============================================================================
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard para verificar que el usuario esté autenticado
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

// Guard para verificar roles específicos (RBAC)
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const rolesPermitidos = route.data?.['roles'] as string[];

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (rolesPermitidos && authService.hasRole(rolesPermitidos)) {
    return true;
  }

  // Redirigir si no tiene permisos
  router.navigate(['/home']);
  return false;
};
