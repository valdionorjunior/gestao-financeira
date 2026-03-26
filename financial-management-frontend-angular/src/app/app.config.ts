import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    MessageService,
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
          // cssLayer: coloca estilos PrimeNG em @layer primeng
          // Tailwind v4 usa layers: theme, base, components, utilities
          // PrimeNG fica entre components e utilities para que
          // utilitários Tailwind (utilities) sempre sobrescrevam PrimeNG
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, components, primeng, utilities',
          },
        },
      },
      ripple: true,
    }),
  ],
};
