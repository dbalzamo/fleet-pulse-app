import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ACTION_CONSEQUENCES, ACTION_LABELS, EmergencyAction } from '../../../shared/models/tracking-model';

export interface ConfirmVehicleActionData {
    vehicleId: string;
    action: EmergencyAction;
}

@Component({
    selector: 'app-confirm-vehicle-action',
    imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
    templateUrl: './confirm-vehicle-action.html',
    styleUrl: './confirm-vehicle-action.scss',
})
export class ConfirmVehicleActionComponent {
    private readonly dialogRef = inject(MatDialogRef<ConfirmVehicleActionComponent>);
    readonly data = inject<ConfirmVehicleActionData>(MAT_DIALOG_DATA);

    protected readonly typedVehicleId = signal('');

    protected readonly actionLabel = computed(() => ACTION_LABELS[this.data.action]);
    protected readonly consequences = computed(() => ACTION_CONSEQUENCES[this.data.action]);
    protected readonly requiresTyping = computed(() => this.data.action === 'emergency_stop');

    protected readonly canConfirm = computed(
        () => !this.requiresTyping() || this.typedVehicleId().trim() === this.data.vehicleId
    );

    confirm(): void {
        if (!this.canConfirm()) {
            return;
        }
        this.dialogRef.close(true);
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}