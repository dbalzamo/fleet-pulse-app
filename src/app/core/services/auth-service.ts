import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, LoginReq, RefreshReq, RegisterReq } from '../../shared/models/auth-model';
import { environment } from '../../../environments/envirornment-local';

const STORAGE_KEY = 'fleetpulse_auth';

@Service()
export class AuthService {
    private readonly http = inject(HttpClient);
    baseUrlAuth: string = environment.apiPath + environment.apiUrlAuth;

    register(data: RegisterReq): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrlAuth}/register`, data);
    }

    login(data: LoginReq): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrlAuth}/login`, data);
    }

    refresh(refreshToken: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrlAuth}/refresh`, { refreshToken });
    }

    logout(refreshToken: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrlAuth}/logout`, { refreshToken });
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
