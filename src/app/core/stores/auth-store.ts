import { computed, inject } from "@angular/core";
import { AuthState, AuthenticatedUser, LoginReq, RegisterReq } from "../../shared/models/auth-model";
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from "@ngrx/signals";
import { AuthService } from "../services/auth-service";
import { Router } from "@angular/router";
import { exhaustMap, pipe, tap } from "rxjs";
import { NotificationService } from "../services/notification-service";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';

interface AuthStoreState extends AuthState {
    user: AuthenticatedUser | null;
}

const initialState: AuthStoreState = {
    tokens: null,
    status: 'idle',
    user: null,
};

export const AuthStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),

    withComputed((store) => ({
        isAuth: computed(() => store.status() === 'authenticated'),
        isLoading: computed(() => store.status() === 'loading'),
        accessToken: computed(() => store.tokens()?.accessToken ?? null),
        currentUser: computed(() => store.user()),
    })),

    withMethods((store, authService = inject(AuthService), router = inject(Router)) => ({
        invalidateSession: () => {
            authService.clearTokens();
            patchState(store, { tokens: null, status: 'unauthenticated', user: null });
            router.navigate(['/login']);
        },
    })),

    withMethods((
        store,
        authService = inject(AuthService),
        router = inject(Router),
        snackBar = inject(NotificationService),
    ) => ({

        restoreSession: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { status: "loading" })),
                exhaustMap(() => {
                    const tokens = authService.loadTokens();
                    if (tokens) {
                        if (authService.isTokenExpired()) {
                            return authService.refresh(tokens.refreshToken).pipe(
                                tapResponse({
                                    next: (newTokens) => {
                                        authService.saveTokens(newTokens);
                                        patchState(store, { tokens: newTokens, status: 'authenticated', user: null });
                                    },
                                    error: () => {
                                        store.invalidateSession();
                                    }
                                })
                            );
                        }
                        patchState(store, { tokens, status: 'authenticated' });
                    } else {
                        patchState(store, { status: 'unauthenticated' });
                    }
                    return [];
                })
            )
        ),

        login: rxMethod<LoginReq>(
            pipe(
                tap(() => patchState(store, { status: 'loading' })),
                exhaustMap((data) => (
                    authService.login(data).pipe(
                        tapResponse({
                            next: (authResponse) => {
                                authService.saveTokens(authResponse);
                                patchState(store, { tokens: authResponse, status: 'authenticated', user: null });
                                router.navigate(['/dashboard']);
                                snackBar.success('Login success');
                            },
                            error: () => {
                                patchState(store, { tokens: null, status: 'unauthenticated' });
                            }
                        }),
                    )
                )),
            )
        ),
        register: rxMethod<RegisterReq>(
            pipe(
                tap(() => patchState(store, { status: 'loading' })),
                exhaustMap((data) => (
                    authService.register(data).pipe(
                        tapResponse({
                            next: (authResponse) => {
                                authService.saveTokens(authResponse);
                                patchState(store, { tokens: authResponse, status: 'authenticated', user: null });
                                router.navigate(['/dashboard']);
                                snackBar.success('Account created successfully!');
                            },
                            error: () => {
                                patchState(store, { tokens: null, status: 'unauthenticated' });
                            },
                        })
                    )
                )),
            )
        ),
        loadCurrentUser: rxMethod<void>(
            pipe(
                exhaustMap(() => (
                    authService.getCurrentUser().pipe(
                        tapResponse({
                            next: (user) => patchState(store, { user }),
                            error: () => {
                                store.invalidateSession();
                            }
                        })
                    )
                ))
            )
        ),
        logout: rxMethod<void>(
            pipe(
                exhaustMap(() => {
                    const refreshToken = authService.getRefreshToken();
                    if (!refreshToken) {
                        store.invalidateSession();
                        return [];
                    }
                    return authService.logout(refreshToken).pipe(
                        tapResponse({
                            next: () => store.invalidateSession(),
                            error: () => store.invalidateSession()
                        })
                    );
                })
            )
        )
    })),
    withHooks({
        onInit(store) {
            store.restoreSession();
        },
    }),

);