import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { environment } from '../environments/envirornment-local';
import { FleetTrackingService } from './core/services/fleet-tracking-service';
import { MockFleetTrackingService } from './core/services/mock-fleet-tracking-service';
import { RealtimeFleetTrackingService } from './core/services/realtime-fleet-tracking-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor
      ])),
    provideRouter(routes, withComponentInputBinding()),
    {
      // Single switch point between the mock simulation and the real backend.
      // Consumers only ever inject the abstract FleetTrackingService contract.
      provide: FleetTrackingService,
      useClass: environment.useMock ? MockFleetTrackingService : RealtimeFleetTrackingService,
    },
  ]
};
