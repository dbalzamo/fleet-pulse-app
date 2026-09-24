import { TestBed } from '@angular/core/testing';
import { LoginReq, RegisterReq, AuthResponse } from '../../shared/models/auth-model';
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
    localStorage.clear();
  });

  afterEach(() => {
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
});
