import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/envirornment-local';
import { EmergencyAction, VehicleActionResult } from '../../shared/models/tracking-model';

@Service()
export class VehicleActionsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiPath + environment.apiUrlVehicles;

    executeAction(vehicleId: string, action: EmergencyAction): Observable<VehicleActionResult> {
        if (environment.useMock) {
            const mocked: VehicleActionResult = { vehicleId, action, status: 'accepted' };
            return of(mocked).pipe(delay(700));
        }
        return this.http.post<VehicleActionResult>(`${this.baseUrl}/${vehicleId}/actions`, { action });
    }
}