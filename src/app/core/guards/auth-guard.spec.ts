import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { authGuard } from './auth-guard';
import { AuthStore } from '../stores/auth-store';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  function setup(status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { status: signal(status) } },
        { provide: Router, useValue: { parseUrl: (url: string) => url } },
      ],
    });
  }

  async function runGuard(): Promise<boolean | string> {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state) as Observable<boolean | string>,
    );
    return firstValueFrom(result);
  }

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('allows the navigation when the user is authenticated', async () => {
    setup('authenticated');
    await expect(runGuard()).resolves.toBe(true);
  });

  it('redirects unauthenticated users to /login', async () => {
    setup('unauthenticated');
    await expect(runGuard()).resolves.toBe('/login');
  });
});