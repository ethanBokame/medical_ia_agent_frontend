import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-accueil',
  standalone: true, 
  imports: [RouterModule],
  templateUrl: './accueil.html',
  styleUrls: ['./accueil.css']
})
export class Accueil implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.addScrollAnimation();
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