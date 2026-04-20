import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path : "",
        loadComponent : () => import('./pages/accueil/accueil').then(m => m.Accueil)
    },
    {
        path : "login",
        loadComponent : () => import('./pages/login/login')
    },
    {
        path : "register",
        loadComponent : () => import('./pages/register/register')
    },
    {
        path : "agent",
        loadComponent : () => import('./pages/agent/agent')
    }
];
 