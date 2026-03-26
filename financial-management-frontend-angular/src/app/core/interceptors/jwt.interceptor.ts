import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  const auth = inject(AuthService);

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return auth.refresh().pipe(
          switchMap(data => {
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${data.accessToken}` } });
            return next(retried);
          }),
          catchError(() => { auth.logout(); return throwError(() => err); })
        );
      }
      return throwError(() => err);
    })
  );
};
