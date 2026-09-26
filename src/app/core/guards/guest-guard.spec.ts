import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { guestGuard } from './guest-guard';
import { AuthStore } from '../stores/auth-store';

describe('guestGuard', () => {
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
      guestGuard(route, state) as Observable<boolean | string>,
    );
    return firstValueFrom(result);
  }

  it('should be created', () => {
    expect(guestGuard).toBeTruthy();
  });

  it('allows guests to reach public pages', async () => {
    setup('unauthenticated');
    await expect(runGuard()).resolves.toBe(true);
  });

  it('redirects authenticated users away from public pages to /dashboard', async () => {
    setup('authenticated');
    await expect(runGuard()).resolves.toBe('/dashboard');
  });
});