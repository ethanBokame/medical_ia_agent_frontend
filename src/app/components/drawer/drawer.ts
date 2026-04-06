import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-drawer',
  imports: [CommonModule],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class Drawer {

  
  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

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

    navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeDrawer();
  }
}
