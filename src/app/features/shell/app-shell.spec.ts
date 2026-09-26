import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signal, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AppShellComponent } from './app-shell';
import { AuthStore } from '../../core/stores/auth-store';
import { ConfirmLogoutComponent } from './dialogs/confirm-logout/confirm-logout';
import { AuthenticatedUser } from '../../shared/models/auth-model';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let component: AppShellComponent;
  let authStoreMock: {
    currentUser: Signal<AuthenticatedUser | null>;
    loadCurrentUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let dialogMock: { open: ReturnType<typeof vi.fn> };

  const user: AuthenticatedUser = {
    id: 'user-1',
    name: 'Jhon Black',
    email: 'jhon.black@fleetpulse.io',
    role: 'Fleet Manager',
  };

  beforeEach(async () => {
    authStoreMock = {
      currentUser: signal<AuthenticatedUser | null>(user),
      loadCurrentUser: vi.fn(),
      logout: vi.fn(),
    };
    dialogMock = {
      open: vi.fn(() => ({ afterClosed: () => of(true) })),
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the current user on init', () => {
    expect(authStoreMock.loadCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('renders the greeting with the user name and the sidebar', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hi, Jhon Black');
    expect(el.querySelectorAll('.sidebar__link').length).toBe(7);
    expect(el.querySelectorAll('.sidebar__link--logout').length).toBe(1);
  });

  it('shows the account menu with the user initial', () => {
    const avatar = fixture.nativeElement.querySelector('.account-menu__avatar--fallback') as HTMLElement;
    expect(avatar.textContent).toBe('J');
  });

  it('confirms before logging out from the sidebar', () => {
    const logoutButton = fixture.nativeElement.querySelector('.sidebar__link--logout') as HTMLButtonElement;
    logoutButton.click();
    fixture.detectChanges();

    expect(dialogMock.open).toHaveBeenCalledTimes(1);
    expect(dialogMock.open.mock.calls[0][0]).toBe(ConfirmLogoutComponent);
    expect(authStoreMock.logout).toHaveBeenCalledTimes(1);
  });

  it('confirms before logging out from the account menu', () => {
    const trigger = fixture.nativeElement.querySelector('.account-menu__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const logoutButton = fixture.nativeElement.querySelector('.account-menu__item--danger') as HTMLButtonElement;
    logoutButton.click();
    fixture.detectChanges();

    expect(dialogMock.open).toHaveBeenCalledTimes(1);
    expect(authStoreMock.logout).toHaveBeenCalledTimes(1);
  });

  it('does not log out when the user cancels the dialog', () => {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(false) });

    const logoutButton = fixture.nativeElement.querySelector('.sidebar__link--logout') as HTMLButtonElement;
    logoutButton.click();
    fixture.detectChanges();

    expect(dialogMock.open).toHaveBeenCalledTimes(1);
    expect(authStoreMock.logout).not.toHaveBeenCalled();
  });
});