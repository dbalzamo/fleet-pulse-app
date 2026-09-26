import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import {
    catchError,
    exhaustMap, filter, finalize, of, switchMap, take, tap, timer,
} from 'rxjs';
import { VehicleService } from '../../../core/services/vehicle-service';
import {
    FirmwareUpdateResult,
    FIRMWARE_UPDATE_STATUS_LABELS,
    MaintenanceRequest,
    RideHistoryEntry,
    VEHICLE_STATUS_COLORS,
    VEHICLE_STATUS_COLORS_BG,
    VEHICLE_STATUS_COLORS_TEXT,
    VEHICLE_STATUS_LABELS,
    VehicleDetail,
} from '../../../shared/models/vehicle-model';
import { DeleteConfirmComponent, DeleteConfirmData } from '../dialogs/delete-confirm/delete-confirm';
import {
    ScheduleMaintenanceComponent,
    ScheduleMaintenanceData,
} from '../dialogs/schedule-maintenance/schedule-maintenance';
import { VehicleBatterySectionComponent } from './battery-section/vehicle-battery-section';
import { VehicleMaintenanceSectionComponent } from './maintenance-section/vehicle-maintenance-section';
import { VehicleRideHistoryComponent } from './ride-history/vehicle-ride-history';

export type DetailErrorKind = 'not_found' | 'generic' | null;

@Component({
    selector: 'app-vehicle-detail',
    imports: [
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        VehicleBatterySectionComponent,
        VehicleMaintenanceSectionComponent,
        VehicleRideHistoryComponent,
    ],
    templateUrl: './vehicle-detail.html',
    styleUrl: './vehicle-detail.scss',
})
export class VehicleDetailComponent {
    private readonly vehicleService = inject(VehicleService);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private readonly destroyRef = inject(DestroyRef);

    readonly id = input.required<string>();

    protected readonly statusLabels = VEHICLE_STATUS_LABELS;
    protected readonly statusColors = VEHICLE_STATUS_COLORS;
    protected readonly statusColorsBg = VEHICLE_STATUS_COLORS_BG;
    protected readonly statusColorsText = VEHICLE_STATUS_COLORS_TEXT;
    protected readonly firmwareStatusLabels = FIRMWARE_UPDATE_STATUS_LABELS;

    protected readonly detail = signal<VehicleDetail | null>(null);
    protected readonly loading = signal(true);
    protected readonly detailError = signal<DetailErrorKind>(null);

    protected readonly removalDisabled = computed(() => this.detail()?.status === 'in_service');

    protected readonly firmwareStatus = signal<FirmwareUpdateResult | null>(null);
    protected readonly firmwareError = signal<string | null>(null);
    protected readonly firmwareRunning = computed(() => this.firmwareStatus()?.status === 'in_progress');

    protected readonly rides = signal<RideHistoryEntry[]>([]);
    protected readonly ridesTotal = signal(0);
    protected readonly ridesLoading = signal(false);
    protected readonly ridesError = signal<string | null>(null);
    private ridePage = -1;
    private readonly ridesExhausted = signal(false);

    ngOnInit(): void {
        this.loadDetail();
    }

    protected retry(): void {
        this.rides.set([]);
        this.ridesTotal.set(0);
        this.ridePage = -1;
        this.ridesExhausted.set(false);
        this.firmwareStatus.set(null);
        this.firmwareError.set(null);
        this.loadDetail();
    }

    protected goBack(): void {
        void this.router.navigate(['/fleet']);
    }

    protected loadMoreRides(): void {
        if (this.ridesLoading() || this.ridesExhausted()) {
            return;
        }
        this.ridesLoading.set(true);
        this.ridesError.set(null);
        const nextPage = this.ridePage + 1;
        this.vehicleService.getRideHistory(this.id(), nextPage)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                catchError(() => {
                    this.ridesError.set('Failed to load ride history.');
                    return of(null);
                }),
                finalize(() => this.ridesLoading.set(false)),
            )
            .subscribe((page) => {
                if (!page) {
                    return;
                }
                this.ridePage = nextPage;
                this.rides.update((prev) => prev.concat(page.content));
                this.ridesTotal.set(page.totalElements);
                if (this.rides().length >= page.totalElements) {
                    this.ridesExhausted.set(true);
                }
            });
    }

    protected openScheduleMaintenance(): void {
        const dialogRef = this.dialog.open<
            ScheduleMaintenanceComponent,
            ScheduleMaintenanceData,
            MaintenanceRequest
        >(ScheduleMaintenanceComponent, {
            data: { vehicleId: this.id() },
            width: '420px',
        });
        dialogRef.afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((request) => {
                if (!request) {
                    return;
                }
                this.vehicleService.scheduleMaintenance(this.id(), request)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe(() => {
                        this.detail.update((current) =>
                            current ? { ...current, nextMaintenanceDate: request.date } : current
                        );
                    });
            });
    }

    protected startFirmwareUpdate(): void {
        if (this.firmwareRunning()) {
            return;
        }
        this.vehicleService.startFirmwareUpdate(this.id())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                if (result.status === 'in_progress') {
                    this.pollFirmwareStatus(result.jobId);
                } else {
                    this.firmwareStatus.set(result);
                }
            });
    }

    protected cancelFirmwareUpdate(): void {
        const running = this.firmwareStatus();
        if (!running || running.status !== 'in_progress') {
            return;
        }
        this.vehicleService.cancelFirmwareUpdate(this.id(), running.jobId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                this.firmwareStatus.set(result);
            });
    }

    protected confirmRemoval(): void {
        const current = this.detail();
        if (!current || this.removalDisabled()) {
            return;
        }
        const dialogData: DeleteConfirmData = {
            title: 'Remove vehicle',
            message: `Remove ${current.model} (${current.id}) from the fleet? This action cannot be undone.`,
        };
        const dialogRef = this.dialog.open<DeleteConfirmComponent, DeleteConfirmData, boolean>(
            DeleteConfirmComponent,
            { data: dialogData, width: '420px' }
        );
        dialogRef.afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed) => {
                if (!confirmed) {
                    return;
                }
                this.vehicleService.deleteVehicle(this.id())
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe(() => {
                        void this.router.navigate(['/fleet']);
                    });
            });
    }

    private loadDetail(): void {
        this.loading.set(true);
        this.detailError.set(null);
        this.vehicleService.getVehicleDetail(this.id())
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                catchError((error: unknown) => {
                    this.detailError.set(
                        error instanceof HttpErrorResponse && error.status === 404
                            ? 'not_found'
                            : 'generic'
                    );
                    return of(null);
                }),
                finalize(() => this.loading.set(false)),
            )
            .subscribe((detail) => {
                if (!detail) {
                    if (this.detailError() === null) {
                        this.detailError.set('not_found');
                    }
                    return;
                }
                this.detail.set(detail);
                this.loadMoreRides();
            });
    }

    private pollFirmwareStatus(jobId: string): void {
        this.firmwareStatus.set({ jobId, status: 'in_progress' });
        this.firmwareError.set(null);
        timer(1600, 1600)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                exhaustMap(() =>
                    this.vehicleService.getFirmwareStatus(this.id(), jobId).pipe(
                        catchError(() => {
                            this.firmwareError.set('Firmware update failed.');
                            return of({ jobId, status: 'failed' } as FirmwareUpdateResult);
                        })
                    )
                ),
                tap((result) => this.firmwareStatus.set(result)),
                filter((result) => result.status !== 'in_progress'),
                take(1),
                switchMap((result) =>
                    result.status === 'completed'
                        ? this.vehicleService.getVehicleDetail(this.id())
                        : of(null)
                ),
            )
            .subscribe((freshDetail: VehicleDetail | null) => {
                if (freshDetail) {
                    this.detail.set(freshDetail);
                }
            });
    }
}