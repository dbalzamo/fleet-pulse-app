import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth-store';

export const PAYMENTS_ACCESS_ROLES: readonly string[] = ['Fleet Manager', 'Accountant', 'Admin'];

export const paymentsGuard: CanActivateFn = () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);
    const user = authStore.currentUser();
    if (!user) {
        return true;
    }
    return PAYMENTS_ACCESS_ROLES.some((role) => role === user.role) ? true : router.parseUrl('/dashboard');
};