import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/envirornment-local';
import { AddVehicleRequest, Vehicle, VehiclePage, VehicleStatusFilter } from '../../shared/models/vehicle-model';

const MOCK_VEHICLES: Vehicle[] = [
    { id: 'veh-001', model: 'Tesla Model 3', vin: '5YJ3E1EAXKF000001', status: 'available', batteryPercentage: 92, estimatedRangeKm: 489, year: 2024, color: '#e63946' },
    { id: 'veh-002', model: 'Tesla Model Y', vin: '7SAYGDEE2NF000002', status: 'in_service', batteryPercentage: 64, estimatedRangeKm: 341, year: 2024, color: '#2b2d42' },
    { id: 'veh-003', model: 'NIO ET7', vin: 'LVGAEEEE5PR000003', status: 'charging', batteryPercentage: 38, estimatedRangeKm: 202, year: 2023, color: '#457b9d' },
    { id: 'veh-004', model: 'NIO ES8', vin: 'LVGAEEEPXRR000004', status: 'maintenance', batteryPercentage: 45, estimatedRangeKm: 240, year: 2023, color: '#1d3557' },
    { id: 'veh-005', model: 'Lucid Air', vin: '50JZABABXK0000005', status: 'available', batteryPercentage: 78, estimatedRangeKm: 612, year: 2025, color: '#f4a261' },
    { id: 'veh-006', model: 'Hyundai Ioniq 6', vin: 'KMHM14AADPU000006', status: 'out_of_service', batteryPercentage: 12, estimatedRangeKm: 64, year: 2024, color: '#a8dadc' },
    { id: 'veh-007', model: 'BMW i4', vin: 'WBA13EZ05RY000007', status: 'in_service', batteryPercentage: 71, estimatedRangeKm: 398, year: 2024, color: '#6c757d' },
    { id: 'veh-008', model: 'Ford Mustang Mach-E', vin: '3FMTK4SE3RM000008', status: 'charging', batteryPercentage: 27, estimatedRangeKm: 151, year: 2023, color: '#ff9f1c' },
];

@Service()
export class VehicleService {
    private readonly http = inject(HttpClient);
    readonly baseUrl = environment.apiPath + environment.apiUrlVehicles;

    private availableMocks: Vehicle[] = MOCK_VEHICLES.map((v) => ({ ...v }));

    private simulateFailure(): void {
        throw new Error('Vehicle backend unreachable');
    }

    getVehicles(params: { search?: string; status?: VehicleStatusFilter; page?: number } = {}): Observable<VehiclePage> {
        if (environment.useMock) {
            let content = [...this.availableMocks];
            const search = params.search?.trim().toLowerCase();
            if (search) {
                content = content.filter(
                    (v) => v.model.toLowerCase().includes(search) || v.vin.toLowerCase().includes(search)
                );
            }
            if (params.status && params.status !== 'all') {
                content = content.filter((v) => v.status === params.status);
            }
            const result: VehiclePage = { content, totalElements: content.length };
            return of(result).pipe(delay(350));
        }
        let httpParams = new HttpParams();
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.status && params.status !== 'all') httpParams = httpParams.set('status', params.status);
        if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
        return this.http.get<VehiclePage>(this.baseUrl, { params: httpParams });
    }

    getVehicle(id: string): Observable<Vehicle | null> {
        if (environment.useMock) {
            const vehicle = this.availableMocks.find((v) => v.id === id) ?? null;
            return of(vehicle).pipe(delay(200));
        }
        return this.http.get<Vehicle>(`${this.baseUrl}/${id}`);
    }

    createVehicle(data: AddVehicleRequest): Observable<Vehicle> {
        if (environment.useMock) {
            const created: Vehicle = { id: `veh-${Date.now()}`, ...data };
            this.availableMocks = this.availableMocks.concat(created);
            return of(created).pipe(delay(350));
        }
        return this.http.post<Vehicle>(this.baseUrl, data);
    }

    deleteVehicle(id: string): Observable<void> {
        if (environment.useMock) {
            this.availableMocks = this.availableMocks.filter((v) => v.id !== id);
            return of(undefined).pipe(delay(350));
        }
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    simulateError(): Observable<VehiclePage> {
        this.simulateFailure();
        return throwError(() => new Error('forced error'));
    }
}