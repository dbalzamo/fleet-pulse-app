import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Observable, catchError, combineLatest, debounceTime, finalize, of, switchMap, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification-service';
import { VehicleService } from '../../../core/services/vehicle-service';
import {
    FleetMetrics,
    VEHICLE_STATUS_FILTERS,
    VEHICLE_STATUS_LABELS,
    Vehicle,
    VehiclePage,
    VehicleStatus,
    VehicleStatusFilter,
} from '../../../shared/models/vehicle-model';
import { AddVehicleComponent } from '../dialogs/add-vehicle/add-vehicle';
import { DeleteConfirmComponent } from '../dialogs/delete-confirm/delete-confirm';
import { FleetMetricsComponent } from '../metrics/fleet-metrics';
import { VehicleCardComponent } from '../vehicle-card/vehicle-card';

interface VehicleData {
    vehicles: Vehicle[];
    total: number;
}

@Component({
    selector: 'app-fleet-dashboard',
    imports: [
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        FleetMetricsComponent,
        VehicleCardComponent,
    ],
    templateUrl: './fleet-dashboard.html',
    styleUrl: './fleet-dashboard.scss',
})
export class FleetDashboard {
    private readonly vehicleService = inject(VehicleService);
    private readonly notificationService = inject(NotificationService);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly statuses = VEHICLE_STATUS_FILTERS;
    protected readonly statusLabels = VEHICLE_STATUS_LABELS;

    protected readonly searchQuery = signal('');
    protected readonly statusFilter = signal<VehicleStatusFilter>('all');

    private readonly vehicleData = signal<VehicleData | null>(null);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly removingIds = signal<string[]>([]);

    protected readonly vehicles = computed(() => this.vehicleData()?.vehicles ?? []);
    protected readonly totalVehicles = computed(() => this.vehicleData()?.total ?? 0);

    protected readonly isFiltersActive = computed(
        () => this.searchQuery().trim() !== '' || this.statusFilter() !== 'all'
    );

    protected readonly metrics = computed<FleetMetrics>(() => {
        const vehicles = this.vehicles();
        const count = (status: VehicleStatus) => vehicles.filter((v) => v.status === status).length;
        return {
            total: vehicles.length,
            available: count('available'),
            inService: count('in_service'),
            maintenance: count('maintenance'),
            charging: count('charging'),
            outOfService: count('out_of_service'),
            averageBattery: vehicles.length
                ? Math.round(vehicles.reduce((sum, v) => sum + v.batteryPercentage, 0) / vehicles.length)
                : 0,
            averageRangeKm: vehicles.length
                ? Math.round(vehicles.reduce((sum, v) => sum + v.estimatedRangeKm, 0) / vehicles.length)
                : 0,
        };
    });

    constructor() {
        combineLatest([toObservable(this.searchQuery), toObservable(this.statusFilter)])
            .pipe(
                debounceTime(300),
                switchMap(([search, status]) => this.fetch({ search, status, page: 0 })),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe();
    }

    protected reload(): void {
        this.fetch({ search: this.searchQuery(), status: this.statusFilter(), page: 0 })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    protected resetFilters(): void {
        this.searchQuery.set('');
        this.statusFilter.set('all');
    }

    protected isRemoving(id: string): boolean {
        return this.removingIds().includes(id);
    }

    protected goToDetails(vehicle: Vehicle): void {
        this.router.navigate(['fleet', vehicle.id]);
    }

    protected openAddVehicle(): void {
        const dialogRef = this.dialog.open(AddVehicleComponent, { width: '540px', autoFocus: false });
        dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result?: Vehicle) => {
                if (!result) {
                    return;
                }
                this.vehicleService
                    .createVehicle(result)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.notificationService.success('Vehicle added successfully.');
                            this.reload();
                        },
                        error: () => {
                            this.notificationService.error('Unable to add the vehicle. Please try again.');
                        },
                    });
            });
    }

    protected removeVehicle(vehicle: Vehicle): void {
        const dialogRef = this.dialog.open(DeleteConfirmComponent, {
            width: '440px',
            autoFocus: false,
            data: {
                title: 'Delete vehicle',
                message: `Are you sure you want to delete ${vehicle.model} (${vehicle.vin})? This action cannot be undone.`,
            },
        });
        dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed?: boolean) => {
                if (!confirmed) {
                    return;
                }
                this.removingIds.update((ids) => [...ids, vehicle.id]);
                this.vehicleService
                    .deleteVehicle(vehicle.id)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.removingIds.update((ids) => ids.filter((id) => id !== vehicle.id));
                            this.notificationService.success('Vehicle deleted.');
                            this.reload();
                        },
                        error: () => {
                            this.removingIds.update((ids) => ids.filter((id) => id !== vehicle.id));
                            this.notificationService.error('Unable to delete the vehicle. Please try again.');
                        },
                    });
            });
    }

    private fetch(filters: { search: string; status: VehicleStatusFilter; page: number }): Observable<VehiclePage | null> {
        this.loading.set(true);
        this.error.set(null);
        return this.vehicleService.getVehicles(filters).pipe(
            tap((res) => this.vehicleData.set({ vehicles: res.content, total: res.totalElements })),
            catchError(() => {
                this.error.set('Unable to load vehicles. Please try again.');
                return of(null);
            }),
            finalize(() => this.loading.set(false))
        );
    }
}