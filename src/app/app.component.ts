import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'gestor-cine-frontend';

  isLoggedIn = false;
  mostrarLoginModal = false;
  username = 'Juan';
  
  loginData = {
    email: '',
    password: ''
  };

  abrirModalLogin() {
    this.mostrarLoginModal = true;
  }

  cerrarModalLogin() {
    this.mostrarLoginModal = false;
  }

  iniciarSesion() {
    // Acá conectás con tu servicio de autenticación actual
    if (this.loginData.email && this.loginData.password) {
      this.isLoggedIn = true;
      this.mostrarLoginModal = false;
    }
  }

  cerrarSesion() {
    this.isLoggedIn = false;
  }
}
