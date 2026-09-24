import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login } from './login';
import { AuthStore } from '../../core/stores/auth-store';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let element: HTMLElement;
  const mockAuthStore = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form as invalid and submit disabled', () => {
    const submitBtn = element.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(component['loginForm']().invalid()).toBeTruthy();
    expect(submitBtn.disabled).toBeTruthy();
  });

  it('should validate username correctly', () => {
    const usernameField = component['loginForm'].username;

    // empty field
    usernameField().value.set('');
    fixture.detectChanges();
    expect(usernameField().invalid()).toBeTruthy();

    // set valid username
    usernameField().value.set('testuser');
    fixture.detectChanges();
    expect(usernameField().valid()).toBeTruthy();
  });

  it('should validate password format correctly', () => {
    const passwordField = component['loginForm'].password;

    // set invalid password
    passwordField().value.set('123');
    fixture.detectChanges();
    expect(passwordField().invalid()).toBeTruthy();
    const minLengthError = passwordField().errors().find(e => e.message === 'At least 8 characters');
    expect(minLengthError).toBeDefined();

    // set valid password
    passwordField().value.set('12345678');
    fixture.detectChanges();
    expect(passwordField().valid()).toBeTruthy();
  });

  it('should call authStore.login on form submission with valid data', async () => {
    const form = component['loginForm'];

    form.username().value.set('jhon.black');
    form.password().value.set('password123');

    fixture.detectChanges();
    // Send form through dom element
    const formElement = element.querySelector('form') as HTMLFormElement;
    formElement.dispatchEvent(new Event('submit'));

    fixture.detectChanges();

    const submitBtn = element.querySelector('button[type="submit"]')?.textContent;

    expect(submitBtn).toContain('Sign in...');

    expect(mockAuthStore.login).toHaveBeenCalledTimes(1);
    expect(mockAuthStore.login).toHaveBeenCalledWith({
      username: 'jhon.black',
      password: 'password123',
    });
  });

  it('should display correct validation error messages when fields are empty and invalid', () => {
    const form = component['loginForm'];

    // Empty fields
    form.username().value.set('');
    form.username().markAsTouched();

    form.password().value.set('');
    form.password().markAsTouched();

    fixture.detectChanges();

    let matErrorElements = element.querySelectorAll('mat-error');
    let errorMessages = Array.from(matErrorElements).map(err => err.textContent?.trim());

    expect(errorMessages).toEqual([
      'Username is required',
      'Password is required',
    ]);
  });
});
