import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path : "",
        loadComponent : () => import('./pages/accueil/accueil')
    },
    {
        path : "login",
        loadComponent : () => import('./pages/login/login')
    },
    {
        path : "agent",
        loadComponent : () => import('./pages/agent/agent')
    }
];
 