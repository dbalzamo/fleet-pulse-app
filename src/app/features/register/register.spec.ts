import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { AuthStore } from '../../core/stores/auth-store';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let element: HTMLElement;
  const mockAuthStore = {
    register: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    vi.clearAllMocks();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form as invalid and submit disabled', () => {
    const submitBtn = element.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(component['registerForm']().invalid()).toBeTruthy();
    expect(submitBtn.disabled).toBeTruthy();
  });

  it('should validate username format correctly', () => {
    const usernameField = component['registerForm'].username;

    // empty field
    usernameField().value.set('');
    fixture.detectChanges();
    expect(usernameField().invalid()).toBeTruthy();

    // too short
    usernameField().value.set('ab');
    fixture.detectChanges();
    expect(usernameField().invalid()).toBeTruthy();

    // valid field
    usernameField().value.set('jhon');
    fixture.detectChanges();
    expect(usernameField().valid()).toBeTruthy();
  });

  it('should validate email format correctly', () => {
    const emailField = component['registerForm'].email;

    // set invalid email
    emailField().value.set('test-invalid-data');
    fixture.detectChanges();
    expect(emailField().invalid()).toBeTruthy();

    // set valid email
    emailField().value.set('test@test');
    fixture.detectChanges();
    expect(emailField().valid()).toBeTruthy();
  });

  it('should validate password and confirmPassword format correctly', () => {
    const passwordField = component['registerForm'].password;
    const confirmPassword = component['registerForm'].confirmPassword;

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

    // compare password with confirmPassword
    passwordField().value.set('12345678');
    confirmPassword().value.set('12345678');
    fixture.detectChanges();
    expect(passwordField().value()).toEqual(confirmPassword().value());
  });

  it('should enable form and submit button when all fields are valid', () => {
    const form = component['registerForm'];

    form.username().value.set('jhon');
    form.email().value.set('jhon.black@example.com');
    form.password().value.set('password123');
    form.confirmPassword().value.set('password123');

    fixture.detectChanges();

    const submitBtn = element.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(form().valid()).toBeTruthy();
    expect(submitBtn.disabled).toBeFalsy();
  });

  it('should call authStore.register on form submission with valid data', async () => {
    const form = component['registerForm'];

    form.username().value.set('jhon');
    form.email().value.set('jhon.black@example.com');
    form.password().value.set('password123');
    form.confirmPassword().value.set('password123');

    fixture.detectChanges();

    // Send form through dom element
    const formElement = element.querySelector('form') as HTMLFormElement;
    formElement.dispatchEvent(new Event('submit'));

    fixture.detectChanges();

    const submitBtn = element.querySelector('button[type="submit"]')?.textContent;

    expect(submitBtn).toContain('Register...');

    expect(mockAuthStore.register).toHaveBeenCalledTimes(1);
    expect(mockAuthStore.register).toHaveBeenCalledWith({
      username: 'jhon',
      email: 'jhon.black@example.com',
      password: 'password123',
    });
  });

  it('should display correct validation error messages when fields are empty vs invalid', () => {
    const form = component['registerForm'];

    // Empty fields
    form.username().value.set('');
    form.email().value.set('');
    form.password().value.set('');
    form.confirmPassword().value.set('');

    [form.username(), form.email(), form.password(), form.confirmPassword()].forEach(f => f.markAsTouched());

    fixture.detectChanges();

    let matErrorElements = element.querySelectorAll('mat-error');
    let errorMessages = Array.from(matErrorElements).map(err => err.textContent?.trim());

    expect(errorMessages).toEqual([
      'Username is required',
      'Email is required',
      'Password is required',
      'Confirm Password is required',
    ]);

    // Invalid fields
    form.username().value.set('jh');
    form.email().value.set('invalid-email');
    form.password().value.set('123');
    form.confirmPassword().value.set('456');

    fixture.detectChanges();

    matErrorElements = element.querySelectorAll('mat-error');
    errorMessages = Array.from(matErrorElements).map(err => err.textContent?.trim());

    expect(errorMessages).toEqual([
      'At least 4 characters',
      'Enter a valid email',
      'At least 8 characters',
      'Passwords do not match',
    ]);
  });
});
