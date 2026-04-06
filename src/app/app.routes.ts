import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path : "",
        loadComponent : () => import('./pages/accueil/accueil').then(m => m.Accueil)
    },
    {
        path : "agent",
        loadComponent : () => import('./pages/agent/agent')
    }
];
 