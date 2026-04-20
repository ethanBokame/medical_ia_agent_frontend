import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Drawer } from '../../components/drawer/drawer';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, Drawer],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export default class Login {

  credentials = {
    email: '',
    password: ''
  };

  isLoading: boolean = false;
  showPassword: boolean = false;
  rememberMe: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges(); // Force la mise à jour de l'UI

    // Vérification que les credentials ne sont pas vides
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Validation du format email
    if (!this.isValidEmail(this.credentials.email)) {
      this.errorMessage = 'Veuillez entrer un email valide';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('Tentative de connexion avec:', this.credentials);

    this.auth.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Réponse reçue:', response);
        const token = response.data?.token || response.token;
        if(token) {
          this.auth.saveToken(token);
          this.isLoading = false;
          this.cdr.detectChanges();
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Token non reçu du serveur';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        
        // Gestion spécifique des erreurs CORS
        if (error.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion ou réessayez plus tard.';
        } else if (error.status === 404) {
          this.errorMessage = 'Service indisponible. Veuillez réessayer plus tard.';
        } else {
          this.errorMessage = error.error?.message || 'Email ou mot de passe incorrect';
        }
        
        this.isLoading = false;
        this.cdr.detectChanges(); // Force la mise à jour du message d'erreur
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onGoogleLogin() {
    console.log('Login avec Google');
    this.errorMessage = 'Fonctionnalité à venir';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  onAppleLogin() {
    console.log('Login avec Apple');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges(); // Optionnel, pour forcer la mise à jour du bouton
  }

  goToRegister() {
    console.log('Redirection vers inscription');
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    console.log('Redirection vers mot de passe oublié');
    // this.router.navigate(['/forgot-password']);
  }
}