import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { of } from 'rxjs';

import { AccountPageComponent } from './account-page';
import { AuthService } from '../../core/services/auth-service';
import { AuthStore } from '../../core/stores/auth-store';
import { NotificationService } from '../../core/services/notification-service';
import { AuthenticatedUser } from '../../shared/models/auth-model';

describe('AccountPageComponent', () => {
  let fixture: ComponentFixture<AccountPageComponent>;
  let component: AccountPageComponent;
  let authServiceMock: { changePassword: ReturnType<typeof vi.fn> };
  let snackbarMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const user: AuthenticatedUser = {
    id: 'user-1',
    name: 'Jhon Black',
    email: 'jhon.black@fleetpulse.io',
    role: 'Fleet Manager',
  };

  beforeEach(async () => {
    authServiceMock = { changePassword: vi.fn(() => of(undefined)) };
    snackbarMock = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AccountPageComponent],
      providers: [
        {
          provide: AuthStore,
          useValue: { currentUser: computed(() => user) },
        },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: snackbarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the authenticated user profile data', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="account-name"]')?.textContent).toBe('Jhon Black');
    expect(el.querySelector('[data-testid="account-email"]')?.textContent).toBe('jhon.black@fleetpulse.io');
    expect(el.querySelector('[data-testid="account-role"]')?.textContent).toBe('Fleet Manager');
    expect(el.querySelector('.account__avatar')?.textContent).toBe('J');
  });

  it('is invalid by default and disables the submit button', () => {
    expect(component['passwordForm']().invalid()).toBe(true);
    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const form = component['passwordForm'];
    form.currentPassword().value.set('1234567');
    form.newPassword().value.set('1234567');
    form.confirmPassword().value.set('1234567');
    fixture.detectChanges();

    expect(form().invalid()).toBe(true);
    const messages = form.newPassword().errors().map((e) => e.message);
    expect(messages).toContain('At least 8 characters');
  });

  it('rejects a confirmation that does not match the new password', () => {
    const form = component['passwordForm'];
    form.currentPassword().value.set('oldpass1');
    form.newPassword().value.set('newpass1');
    form.confirmPassword().value.set('newpass2');
    fixture.detectChanges();

    expect(form().invalid()).toBe(true);
    const messages = form.confirmPassword().errors().map((e) => e.message);
    expect(messages).toContain('New password and confirmation do not match');
  });

  it('submits the change when the form is valid', async () => {
    const form = component['passwordForm'];
    form.currentPassword().value.set('oldpass1');
    form.newPassword().value.set('newpass1');
    form.confirmPassword().value.set('newpass1');
    fixture.detectChanges();

    expect(form().valid()).toBe(true);

    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formElement.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(authServiceMock.changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldpass1',
      newPassword: 'newpass1',
    });
    expect(snackbarMock.success).toHaveBeenCalledWith('Password updated successfully');
    expect(form.currentPassword().value()).toBe('');
  });
});