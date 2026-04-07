import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [RouterModule, CommonModule, ConfirmModal],  // ← Importe ConfirmModal
  templateUrl: './accueil.html',
  styleUrls: ['./accueil.css']
})
export class Accueil implements OnInit {

  showLogoutModal = false;  // ← Variable pour afficher/cacher le modal
  isLoggedIn = false;

  constructor(private authService: Auth) { }

  ngOnInit(): void {
    this.addScrollAnimation();
    this.isLoggedIn = this.authService.isLoggedIn();

    setInterval(() => {
      this.isLoggedIn = this.authService.isLoggedIn();
    }, 100);
  }

  // Affiche le modal
  logout() {
    this.showLogoutModal = true;
  }

  // Confirme la déconnexion
  confirmLogout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.showLogoutModal = false;
  }

  // Annule la déconnexion
  cancelLogout() {
    this.showLogoutModal = false;
  }

  addScrollAnimation() {
    window.addEventListener('scroll', () => {
      const elements = document.querySelectorAll('.transition-all.duration-300');
      elements.forEach(element => {
        const position = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight;
        
        if (position < screenPosition - 100) {
          element.classList.add('opacity-100', 'translate-y-0');
        }
      });
    });
  }
}