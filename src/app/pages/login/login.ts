import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export default class Login {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  rememberMe: boolean = false;
  errorMessage: string = '';

  constructor(private router: Router) {}

  onLogin() {
    // Validation simple
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Veuillez entrer un email valide';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulation d'appel API
    setTimeout(() => {
      this.isLoading = false;
      // Simulation de connexion réussie
      if (this.email === 'demo@medichat.com' && this.password === 'demo123') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', this.email);
        if (this.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        this.router.navigate(['/agent']);
      } else {
        this.errorMessage = 'Email ou mot de passe incorrect';
      }
    }, 1500);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onGoogleLogin() {
    console.log('Login avec Google');
    // Implémentation Google OAuth
  }

  onAppleLogin() {
    console.log('Login avec Apple');
    // Implémentation Apple OAuth
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    console.log('Redirection vers inscription');
    // this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    console.log('Redirection vers mot de passe oublié');
    // this.router.navigate(['/forgot-password']);
  }
}