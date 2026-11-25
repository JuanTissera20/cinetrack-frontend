import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  @Input() isModal = false; // 👈 Indica si se está mostrando como modal
  @Output() loginSuccess = new EventEmitter<void>(); // 👈 Avisa al padre cuando entra

  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  onLogin(): void {
    if (!this.username || !this.password) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({username: this.username, password: this.password}).subscribe({
    next: () => {
        this.loading = false;
        if (this.isModal) {
          this.loginSuccess.emit(); // Cierra el modal y carga la biblioteca
        } else {
          this.router.navigate(['/board']);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Usuario o contraseña incorrectos.';
      }
    });
  }
}
