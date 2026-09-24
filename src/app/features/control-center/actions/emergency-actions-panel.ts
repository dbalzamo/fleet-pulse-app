import { DestroyRef, Component, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../core/services/notification-service';
import { VehicleActionsService } from '../../../core/services/vehicle-actions-service';
import { ACTION_LABELS, ActiveVehicle, EmergencyAction, VehicleActionRequest } from '../../../shared/models/tracking-model';
import { ConfirmVehicleActionComponent } from '../dialogs/confirm-vehicle-action';

@Component({
    selector: 'app-emergency-actions-panel',
    imports: [MatButtonModule, MatProgressSpinnerModule],
    templateUrl: './emergency-actions-panel.html',
    styleUrl: './emergency-actions-panel.scss',
})
export class EmergencyActionsPanelComponent {
    readonly selectedVehicle = input<ActiveVehicle | null>(null);

    readonly performed = output<VehicleActionRequest>();

    private readonly actionsService = inject(VehicleActionsService);
    private readonly dialog = inject(MatDialog);
    private readonly notification = inject(NotificationService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly actionLabels = ACTION_LABELS;
    protected readonly actions: readonly EmergencyAction[] = [
        'maintenance',
        'send_operator',
        'return_to_depot',
        'emergency_stop',
    ];

    protected readonly pendingAction = signal<EmergencyAction | null>(null);
    protected readonly sending = computed(() => this.pendingAction() !== null);

    protected requestAction(action: EmergencyAction): void {
        const vehicle = this.selectedVehicle();
        if (!vehicle || this.sending()) {
            return;
        }
        const dialogRef = this.dialog.open(ConfirmVehicleActionComponent, {
            width: '480px',
            autoFocus: false,
            data: { vehicleId: vehicle.id, action },
        });
        dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed?: boolean) => {
                if (!confirmed) {
                    return;
                }
                this.runAction(vehicle, action);
            });
    }

    private runAction(vehicle: ActiveVehicle, action: EmergencyAction): void {
        this.pendingAction.set(action);
        this.actionsService.executeAction(vehicle.id, action).subscribe({
            next: () => {
                this.pendingAction.set(null);
                this.performed.emit({ vehicleId: vehicle.id, action });
                this.notification.success(`${ACTION_LABELS[action]} command sent to ${vehicle.id}.`);
            },
            error: () => {
                this.pendingAction.set(null);
                this.notification.error(
                    `Unable to send "${ACTION_LABELS[action]}" to ${vehicle.id}. The command was not executed.`
                );
            },
        });
    }
}