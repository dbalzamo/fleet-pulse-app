import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/login/login').then(c => c.Login),
        canActivate: [guestGuard]
    },
    {
        path: 'register',
        loadComponent: () => import('./features/register/register').then(c => c.Register),
        canActivate: [guestGuard]

    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(c => c.Dashboard),
        canActivate: [authGuard],
    },
    {
        path: 'fleet',
        loadComponent: () => import('./features/fleet/dashboard/fleet-dashboard').then(c => c.FleetDashboard),
        canActivate: [authGuard],
    },
    {
        path: 'fleet/:id',
        loadComponent: () => import('./features/fleet/details/fleet-details').then(c => c.FleetDetails),
        canActivate: [authGuard],
    },
    {
        path: 'control-center',
        loadComponent: () => import('./features/control-center/control-center').then(c => c.ControlCenterComponent),
        canActivate: [authGuard],
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then(c => c.NotFound),
    }
];
