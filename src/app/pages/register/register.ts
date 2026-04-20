import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Drawer } from '../../components/drawer/drawer';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, Drawer],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export default class Register {

  userData = {
    nom: '',
    email: '',
    password: ''
  };

  confirmPassword: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    // Réinitialisation des messages
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    // Validation des champs
    if (!this.userData.nom || !this.userData.email || !this.userData.password || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Validation du nom (minimum 2 caractères)
    if (this.userData.nom.trim().length < 2) {
      this.errorMessage = 'Le nom doit contenir au moins 2 caractères';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Validation du format email
    if (!this.isValidEmail(this.userData.email)) {
      this.errorMessage = 'Veuillez entrer un email valide';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Validation du mot de passe (minimum 6 caractères)
    if (this.userData.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Vérification que les mots de passe correspondent
    if (this.userData.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('Tentative d\'inscription avec:', this.userData);

    this.auth.register(this.userData).subscribe({
      next: (response) => {
        console.log('Réponse reçue:', response);
        
        if (response.success && response.data?.token) {
          // Sauvegarder le token
          this.auth.saveToken(response.data.token);
          
          // Afficher le message de succès
          this.successMessage = response.message || 'Inscription réussie ! Redirection...';
          this.isLoading = false;
          this.cdr.detectChanges();
          
          // Redirection après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de l\'inscription';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Erreur d\'inscription:', error);
        
        // Gestion spécifique des erreurs
        if (error.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion ou réessayez plus tard.';
        } else if (error.status === 409) {
          this.errorMessage = 'Cet email est déjà utilisé';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Données invalides';
        } else {
          this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription';
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onGoogleRegister() {
    console.log('Inscription avec Google');
    // Vous pouvez rediriger vers la même logique que le login Google
    // ou afficher un message que cette fonctionnalité viendra plus tard
    this.errorMessage = 'Fonctionnalité à venir';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.cdr.detectChanges();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}