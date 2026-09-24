export interface RegisterReq {
    email: string;
    username: string;
    password: string;
}

export interface RegisterFormModel extends RegisterReq {
    confirmPassword: string;
}

export interface LoginReq {
    username: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

export interface RefreshReq {
    refreshToken: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
    tokens: AuthResponse | null;
    status: AuthStatus;
}
