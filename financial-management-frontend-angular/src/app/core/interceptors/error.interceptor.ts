import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const msg = inject(MessageService);
  return next(req).pipe(
    catchError(err => {
      if (err.status !== 401) {
        const detail = err.error?.message ?? err.error?.error ?? 'Erro inesperado';
        msg.add({ severity: 'error', summary: 'Erro', detail });
      }
      return throwError(() => err);
    })
  );
};
