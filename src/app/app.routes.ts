import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./calculator/calculator').then((m) => m.CalculatorComponent),
    },
    {
        path: 'sessions',
        loadComponent: () => import('./sessions/sessions').then((m) => m.SessionsComponent),
        canActivate: [authGuard],
    },
    {
        path: '**',
        redirectTo: '',
    },
];
