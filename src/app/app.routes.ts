import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path : "",
        loadComponent : () => import('./pages/accueil/accueil')
    },
    {
        path : "agent",
        loadComponent : () => import('./pages/agent/agent')
    }
];
 