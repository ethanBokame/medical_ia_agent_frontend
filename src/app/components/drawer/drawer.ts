import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-drawer',
  imports: [CommonModule],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class Drawer {
  
  constructor(
    private cdr: ChangeDetectorRef, 
    private router: Router,
    private auth: Auth
  ) {}

  isDrawerOpen = false;
  
  toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
    if (this.isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    this.cdr.detectChanges();
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  navigateTo(route: string) {
    // Si l'utilisateur n'est pas connecté et essaie d'accéder à /agent
    if (route === '/agent' && !this.isLoggedIn()) {
      this.router.navigate(['/login']);
      this.closeDrawer();
      return;
    }
    
    this.router.navigate([route]);
    this.closeDrawer();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.closeDrawer();
  }
}