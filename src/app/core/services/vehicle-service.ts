import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/envirornment-local';
import {
    AddVehicleRequest,
    FirmwareUpdateResult,
    FirmwareUpdateStatus,
    MaintenanceRequest,
    RideHistoryEntry,
    RideHistoryPage,
    RideOutcome,
    Vehicle,
    VehicleDetail,
    VehiclePage,
    VehicleStatusFilter,
} from '../../shared/models/vehicle-model';
import { toIsoDate } from '../../shared/utils/date';

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

interface MockVehicleExtras {
    serialNumber: string;
    batteryType: string;
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    totalKm: number;
    firmwareVersion: string;
}

const BATTERY_TYPES = ['LFP 74 kWh', 'NMC 82 kWh', 'LFP 78 kWh', 'NMC 90 kWh', 'NMC 118 kWh', 'LFP 77 kWh', 'NMC 81 kWh', 'NMC 91 kWh'] as const;
const RIDE_OUTCOMES: RideOutcome[] = ['completed', 'completed', 'cancelled', 'completed', 'interrupted'];
const MOCK_RIDE_PAGE_SIZE = 5;
const MOCK_RIDE_COUNT = 12;

function addDays(date: Date, days: number): string {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return toIsoDate(copy);
}

function buildMockExtras(index: number, vin: string): MockVehicleExtras {
    const safeIndex = Math.max(index, 0);
    return {
        serialNumber: vin,
        batteryType: BATTERY_TYPES[safeIndex % BATTERY_TYPES.length],
        lastMaintenanceDate: addDays(new Date(), -(40 + safeIndex * 7)),
        // the maintenance-status mock (veh-004) is deliberately overdue
        nextMaintenanceDate: index === 3 ? addDays(new Date(), -12) : addDays(new Date(), 30 + safeIndex * 3),
        totalKm: 15000 + safeIndex * 7300,
        firmwareVersion: '2.4.1',
    };
}

function buildMockRides(id: string): RideHistoryEntry[] {
    return Array.from({ length: MOCK_RIDE_COUNT }, (_, i) => {
        const outcome = RIDE_OUTCOMES[i % RIDE_OUTCOMES.length];
        return {
            rideId: `${id}-ride-${String(MOCK_RIDE_COUNT - i).padStart(3, '0')}`,
            date: addDays(new Date(), -(i + 2)),
            durationMinutes: 8 + ((i * 7) % 42),
            outcome,
        };
    });
}

@Service()
export class VehicleService {
    private readonly http = inject(HttpClient);
    readonly baseUrl = environment.apiPath + environment.apiUrlVehicles;

    private availableMocks: Vehicle[] = MOCK_VEHICLES.map((v) => ({ ...v }));
    private detailExtras: MockVehicleExtras[] = MOCK_VEHICLES.map((v, i) => buildMockExtras(i, v.vin));
    private readonly ridesCache = new Map<string, RideHistoryEntry[]>();
    private readonly firmwareJobs = new Map<string, { status: FirmwareUpdateStatus; polls: number }>();

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

    getVehicleDetail(id: string): Observable<VehicleDetail | null> {
        if (environment.useMock) {
            const vehicle = this.availableMocks.find((v) => v.id === id) ?? null;
            if (!vehicle) {
                return of(null).pipe(delay(200));
            }
            const index = MOCK_VEHICLES.findIndex((v) => v.id === id);
            const extras = (this.detailExtras[index] ?? buildMockExtras(index, vehicle.vin));
            const detail: VehicleDetail = {
                id: vehicle.id,
                model: vehicle.model,
                serialNumber: extras.serialNumber,
                status: vehicle.status,
                batteryPercentage: vehicle.batteryPercentage,
                estimatedRangeKm: vehicle.estimatedRangeKm,
                batteryType: extras.batteryType,
                lastMaintenanceDate: extras.lastMaintenanceDate,
                nextMaintenanceDate: extras.nextMaintenanceDate,
                totalKm: extras.totalKm,
                firmwareVersion: extras.firmwareVersion,
            };
            return of(detail).pipe(delay(250));
        }
        return this.http.get<VehicleDetail>(`${this.baseUrl}/${id}`);
    }

    getRideHistory(id: string, page: number): Observable<RideHistoryPage> {
        if (environment.useMock) {
            if (!this.ridesCache.has(id)) {
                this.ridesCache.set(id, buildMockRides(id));
            }
            const all = this.ridesCache.get(id) ?? [];
            const start = page * MOCK_RIDE_PAGE_SIZE;
            const result: RideHistoryPage = {
                content: all.slice(start, start + MOCK_RIDE_PAGE_SIZE),
                totalElements: all.length,
            };
            return of(result).pipe(delay(250));
        }
        const httpParams = new HttpParams().set('page', String(page));
        return this.http.get<RideHistoryPage>(`${this.baseUrl}/${id}/rides`, { params: httpParams });
    }

    scheduleMaintenance(id: string, request: MaintenanceRequest): Observable<void> {
        if (environment.useMock) {
            const index = MOCK_VEHICLES.findIndex((v) => v.id === id);
            if (index >= 0) {
                this.detailExtras[index] = { ...this.detailExtras[index], nextMaintenanceDate: request.date };
            }
            return of(undefined).pipe(delay(300));
        }
        return this.http.post<void>(`${this.baseUrl}/${id}/maintenance`, request);
    }

    startFirmwareUpdate(id: string): Observable<FirmwareUpdateResult> {
        if (environment.useMock) {
            const jobId = `fw-${Date.now()}`;
            this.firmwareJobs.set(jobId, { status: 'in_progress', polls: 0 });
            return of<FirmwareUpdateResult>({ jobId, status: 'in_progress' }).pipe(delay(200));
        }
        return this.http.post<FirmwareUpdateResult>(`${this.baseUrl}/${id}/firmware-update`, {});
    }

    getFirmwareStatus(id: string, jobId: string): Observable<FirmwareUpdateResult> {
        if (environment.useMock) {
            const job = this.firmwareJobs.get(jobId);
            if (!job) {
                return of<FirmwareUpdateResult>({ jobId, status: 'failed' }).pipe(delay(150));
            }
            if (job.status === 'in_progress') {
                job.polls += 1;
                if (job.polls >= 2) {
                    job.status = 'completed';
                }
            }
            return of<FirmwareUpdateResult>({ jobId, status: job.status }).pipe(delay(150));
        }
        return this.http.get<FirmwareUpdateResult>(`${this.baseUrl}/${id}/firmware-update/${jobId}`);
    }

    cancelFirmwareUpdate(id: string, jobId: string): Observable<FirmwareUpdateResult> {
        if (environment.useMock) {
            const job = this.firmwareJobs.get(jobId);
            if (job && job.status === 'in_progress') {
                job.status = 'cancelled';
            }
            return of<FirmwareUpdateResult>({ jobId, status: job?.status ?? 'cancelled' }).pipe(delay(150));
        }
        return this.http.post<FirmwareUpdateResult>(`${this.baseUrl}/${id}/firmware-update/cancel`, {});
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