import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
    AuthResponse,
    AuthenticatedUser,
    ChangePasswordRequest,
    LoginReq,
    RefreshReq,
    RegisterReq
} from '../../shared/models/auth-model';
import { environment } from '../../../environments/envirornment-local';

const STORAGE_KEY = 'fleetpulse_auth';

const MOCK_USER: AuthenticatedUser = {
    id: 'user-1',
    name: 'Jhon Black',
    email: 'jhon.black@fleetpulse.io',
    role: 'Fleet Manager',
};

function buildMockAuthResponse(): AuthResponse {
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: MOCK_USER.id, name: MOCK_USER.name, exp: now + 86400, iat: now }));
    return {
        accessToken: `${header}.${payload}.mock-signature`,
        refreshToken: `mock-refresh-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 86400,
    };
}

@Service()
export class AuthService {
    private readonly http = inject(HttpClient);
    baseUrlAuth: string = environment.apiPath + environment.apiUrlAuth;

    register(data: RegisterReq): Observable<AuthResponse> {
        if (environment.useMock) {
            return of(buildMockAuthResponse()).pipe(delay(400));
        }
        return this.http.post<AuthResponse>(`${this.baseUrlAuth}/register`, data);
    }

    login(data: LoginReq): Observable<AuthResponse> {
        if (environment.useMock) {
            return of(buildMockAuthResponse()).pipe(delay(350));
        }
        return this.http.post<AuthResponse>(`${this.baseUrlAuth}/login`, data);
    }

    refresh(refreshToken: string): Observable<AuthResponse> {
        if (environment.useMock) {
            return of(buildMockAuthResponse()).pipe(delay(200));
        }
        return this.http.post<AuthResponse>(`${this.baseUrlAuth}/refresh`, { refreshToken });
    }

    logout(refreshToken: string): Observable<void> {
        if (environment.useMock) {
            return of(undefined).pipe(delay(150));
        }
        return this.http.post<void>(`${this.baseUrlAuth}/logout`, { refreshToken });
    }

    getCurrentUser(): Observable<AuthenticatedUser> {
        if (environment.useMock) {
            return of({ ...MOCK_USER }).pipe(delay(200));
        }
        return this.http.get<AuthenticatedUser>(`${this.baseUrlAuth}/me`);
    }

    changePassword(data: ChangePasswordRequest): Observable<void> {
        if (environment.useMock) {
            return of(undefined).pipe(delay(300));
        }
        return this.http.post<void>(`${this.baseUrlAuth}/change-password`, data);
    }

    saveTokens(tokens: AuthResponse): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    }

    loadTokens(): AuthResponse | null {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }

    clearTokens(): void {
        localStorage.removeItem(STORAGE_KEY);
    }

    getAccessToken(): string | null {
        return this.loadTokens()?.accessToken ?? null;
    }

    getRefreshToken(): string | null {
        return this.loadTokens()?.refreshToken ?? null;
    }

    isTokenExpired(): boolean {
        const tokens = this.loadTokens();
        if (!tokens) return true;
        const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    }
}