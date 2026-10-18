// ============================================================================
// SERVICIO DE AUTENTICACIÓN Y SESIÓN (LOCALSTORAGE)
// Archivo: src/app/services/auth.service.ts
// ============================================================================
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Usuario } from '../models/restaurante.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private readonly tokenKey = 'restaurante_jwt_token';
  private readonly userKey = 'restaurante_usuario';

  // Señales reactivas (Angular 22) para actualización instantánea del Navbar
  public currentUser = signal<Usuario | null>(this.getUsuarioAlmacenado());
  public isAuthenticated = signal<boolean>(!!this.getToken());

  constructor(private http: HttpClient) {}

  login(credenciales: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((res) => {
        if (res.ok && res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.usuario));
          this.currentUser.set(res.usuario);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getUsuarioAlmacenado(): Usuario | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Sesión válida = token presente Y no vencido (se lee el campo exp del JWT)
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(base64)) as { exp?: number };
      return !!exp && Date.now() < exp * 1000;
    } catch {
      return false;
    }
  }

  hasRole(rolesPermitidos: string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return rolesPermitidos.includes(user.rol);
  }
}
