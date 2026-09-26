import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { paymentsGuard } from './payments-guard';
import { AuthStore } from '../stores/auth-store';
import { AuthenticatedUser } from '../../shared/models/auth-model';

describe('paymentsGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  function setup(user: AuthenticatedUser | null): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { currentUser: () => user } },
        { provide: Router, useValue: { parseUrl: (url: string) => url } },
      ],
    });
  }

  it('allows users with an admin role', () => {
    setup({ id: 'user-1', name: 'Jhon Black', email: 'j@fleetpulse.io', role: 'Fleet Manager' });
    const result = TestBed.runInInjectionContext(() => paymentsGuard(route, state));
    expect(result).toBe(true);
  });

  it('allows users with an accounting role', () => {
    setup({ id: 'user-2', name: 'Elena', email: 'e@fleetpulse.io', role: 'Accountant' });
    const result = TestBed.runInInjectionContext(() => paymentsGuard(route, state));
    expect(result).toBe(true);
  });

  it('redirects users without an allowed role to the dashboard', () => {
    setup({ id: 'user-3', name: 'Marco', email: 'm@fleetpulse.io', role: 'Driver' });
    const result = TestBed.runInInjectionContext(() => paymentsGuard(route, state));
    expect(result).toBe('/dashboard');
  });

  it('defers the check while the user is not loaded yet', () => {
    setup(null);
    const result = TestBed.runInInjectionContext(() => paymentsGuard(route, state));
    expect(result).toBe(true);
  });
});