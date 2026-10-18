import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email: string = '';
  password: string = '';
  cargando: boolean = false;
  errorMensaje: string = '';

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMensaje = 'Por favor complete todos los campos obligatorios.';
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.cargando = false;
        // Redirigir a la pantalla de Inicio
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = err.error?.mensaje || 'Credenciales incorrectas o fallo de conexión.';
      },
    });
  }

  // Métodos rápidos para facilitar la sustentación y demostración en clase
  rellenarAdmin(): void {
    this.email = 'admin@restaurante.com';
    this.password = 'Admin123*';
  }

  rellenarMesero(): void {
    this.email = 'mesero@restaurante.com';
    this.password = 'Mesero123*';
  }

  rellenarCocina(): void {
    this.email = 'cocina@restaurante.com';
    this.password = 'Cocina123*';
  }
}
