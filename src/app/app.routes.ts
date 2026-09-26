import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { paymentsGuard } from './core/guards/payments-guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/login/login').then(c => c.Login),
        canActivate: [guestGuard],
    },
    {
        path: 'register',
        loadComponent: () => import('./features/register/register').then(c => c.Register),
        canActivate: [guestGuard],
    },
    {
        path: '',
        loadComponent: () => import('./features/shell/app-shell').then(c => c.AppShellComponent),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/home/dashboard-home/dashboard-home').then(c => c.DashboardHomeComponent),
            },
            {
                path: 'fleet',
                loadComponent: () => import('./features/fleet/dashboard/fleet-dashboard').then(c => c.FleetDashboard),
            },
            {
                path: 'fleet/:id',
                loadComponent: () => import('./features/fleet/details/vehicle-detail').then(c => c.VehicleDetailComponent),
            },
            {
                path: 'control-center',
                loadComponent: () => import('./features/control-center/control-center').then(c => c.ControlCenterComponent),
            },
            {
                path: 'payments',
                loadComponent: () => import('./features/payments/payments-dashboard/payments-dashboard').then(c => c.PaymentsDashboardComponent),
                canActivate: [paymentsGuard],
            },
            {
                path: 'customers',
                loadComponent: () => import('./features/customers/customers-page').then(c => c.CustomersPage),
            },
            {
                path: 'customers/:id',
                loadComponent: () => import('./features/customers/customer-details-page').then(c => c.CustomerDetailsPage),
            },
            {
                path: 'account',
                loadComponent: () => import('./features/account/account-page').then(c => c.AccountPageComponent),
            },
            {
                path: 'settings',
                loadComponent: () => import('./features/settings/settings-page').then(c => c.SettingsPage),
            },
        ],
    },
    {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then(c => c.NotFound),
    },
];