import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, concatMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { environment } from '../../../environments/envirornment-local';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const baseUrlAuth: string = environment.apiPath + environment.apiUrlAuth;

  const isPublicAuthEndpoint = req.url.startsWith(baseUrlAuth) &&
    (req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/refresh'));

  const accessToken = authService.getAccessToken();

  let authReq = req;
  if (accessToken && !isPublicAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !isPublicAuthEndpoint &&
        !req.headers.has('X-Auth-Retry')
      ) {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          return authService.refresh(refreshToken).pipe(
            concatMap((newTokens) => {
              authService.saveTokens(newTokens);
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newTokens.accessToken}`,
                  'X-Auth-Retry': 'true',
                },
              });
              return next(retryReq);
            }),
            catchError(() => {
              authService.clearTokens();
              router.navigate(['/login']);
              return throwError(() => error);
            })
          );
        }
        authService.clearTokens();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
