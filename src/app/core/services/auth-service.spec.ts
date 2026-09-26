import { TestBed } from '@angular/core/testing';
import { LoginReq, RegisterReq, AuthResponse, ChangePasswordRequest, AuthenticatedUser } from '../../shared/models/auth-model';
import { AuthService } from './auth-service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/envirornment-local';
import { provideHttpClient } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const fakeAuthResponse: AuthResponse = {
    accessToken: 'fake-jwt-token',
    refreshToken: 'fake-refresh-uuid',
    tokenType: 'Bearer',
    expiresIn: 900,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    environment.useMock = false;
    localStorage.clear();
  });

  afterEach(() => {
    environment.useMock = true;
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Login', () => {

    const fakeUserLogin: LoginReq = {
      username: 'testuser',
      password: '12345678',
    };

    it('posts the credentials to the login endpoint', () => {
      service.login(fakeUserLogin).subscribe((res) => {
        expect(res).toEqual(fakeAuthResponse);
      });

      const req = httpMock.expectOne(`${environment.apiPath + environment.apiUrlAuth}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(fakeUserLogin);
      req.flush(fakeAuthResponse);
    });
  });

  describe('Register', () => {

    const fakeUserRegister: RegisterReq = {
      username: 'testuser',
      email: 'test@email.test',
      password: '12345678',
    };

    it('create user with register endpoint', () => {
      service.register(fakeUserRegister).subscribe((res) => {
        expect(res).toEqual(fakeAuthResponse);
      });
      const req = httpMock.expectOne(`${environment.apiPath + environment.apiUrlAuth}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(fakeUserRegister);
      req.flush(fakeAuthResponse);
    });
  });

  describe('Token management', () => {
    it('should save and load tokens', () => {
      service.saveTokens(fakeAuthResponse);
      expect(service.loadTokens()).toEqual(fakeAuthResponse);
    });

    it('should clear tokens', () => {
      service.saveTokens(fakeAuthResponse);
      service.clearTokens();
      expect(service.loadTokens()).toBeNull();
    });

    it('should return null when no tokens exist', () => {
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('HTTP endpoints', () => {
    it('posts the refresh token to the logout endpoint', () => {
      environment.useMock = false;
      service.logout('refresh-uuid').subscribe();
      const req = httpMock.expectOne(`${environment.apiPath + environment.apiUrlAuth}/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'refresh-uuid' });
      req.flush(null);
    });

    it('fetches the current user from /me', () => {
      environment.useMock = false;
      service.getCurrentUser().subscribe();
      const req = httpMock.expectOne(`${environment.apiPath + environment.apiUrlAuth}/me`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: 'user-1', name: 'Jhon', email: 'e@e.it', role: 'Mgr' });
    });

    it('posts the change-password payload', () => {
      environment.useMock = false;
      const payload: ChangePasswordRequest = { currentPassword: 'old-pass', newPassword: 'new-pass' };
      service.changePassword(payload).subscribe();
      const req = httpMock.expectOne(`${environment.apiPath + environment.apiUrlAuth}/change-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('Mock mode', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      environment.useMock = true;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('login returns a fake access token with a future expiration', async () => {
      let response: AuthResponse | undefined;
      service.login({ username: 'user', password: 'password' }).subscribe((res) => (response = res));
      await vi.advanceTimersByTimeAsync(400);
      expect(response).toBeDefined();
      expect(response!.accessToken).toContain('.');
      expect(response!.refreshToken).toContain('mock-refresh');
      service.saveTokens(response!);
      expect(service.isTokenExpired()).toBe(false);
    });

    it('logout resolves without calling the backend', async () => {
      let completed = false;
      service.logout('refresh-uuid').subscribe(() => (completed = true));
      await vi.advanceTimersByTimeAsync(150);
      expect(completed).toBe(true);
    });

    it('getCurrentUser returns the mock user', async () => {
      let user: AuthenticatedUser | undefined;
      service.getCurrentUser().subscribe((res) => (user = res));
      await vi.advanceTimersByTimeAsync(200);
      expect(user).toBeDefined();
      expect(user!.email).toBe('jhon.black@fleetpulse.io');
    });

    it('changePassword resolves successfully', async () => {
      let completed = false;
      service.changePassword({ currentPassword: 'a', newPassword: 'b' }).subscribe(() => (completed = true));
      await vi.advanceTimersByTimeAsync(300);
      expect(completed).toBe(true);
    });
  });
});