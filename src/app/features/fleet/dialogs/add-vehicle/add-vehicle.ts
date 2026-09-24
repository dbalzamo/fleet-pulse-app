import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, max, min, minLength, required } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AddVehicleRequest, VEHICLE_STATUS_LABELS, VEHICLE_STATUSES, VehicleStatus } from '../../../../shared/models/vehicle-model';

export interface VehicleFormModel {
    model: string;
    vin: string;
    year: number | null;
    batteryPercentage: number | null;
    estimatedRangeKm: number | null;
    color: string;
}

@Component({
    selector: 'app-add-vehicle',
    imports: [
        FormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormField,
        FormRoot,
    ],
    templateUrl: './add-vehicle.html',
    styleUrl: './add-vehicle.scss',
})
export class AddVehicleComponent {
    private readonly dialogRef = inject(MatDialogRef<AddVehicleComponent>);

    protected readonly statuses = VEHICLE_STATUSES;
    protected readonly statusLabels = VEHICLE_STATUS_LABELS;
    protected readonly status = signal<VehicleStatus>('available');

    protected readonly model = signal<VehicleFormModel>({
        model: '',
        vin: '',
        year: null,
        batteryPercentage: null,
        estimatedRangeKm: null,
        color: '',
    });

    protected readonly vehicleForm = form(this.model, (schemaPath) => {
        required(schemaPath.model, { message: 'Model is required' });
        minLength(schemaPath.model, 2, { message: 'At least 2 characters' });
        required(schemaPath.vin, { message: 'VIN is required' });
        minLength(schemaPath.vin, 5, { message: 'At least 5 characters' });
        if (schemaPath.year) {
            min(schemaPath.year, 1995, { message: 'Year must be >= 1995' });
            max(schemaPath.year, 2030, { message: 'Year must be <= 2030' });
        }
        required(schemaPath.batteryPercentage, { message: 'Battery is required' });
        min(schemaPath.batteryPercentage, 0, { message: 'Min 0%' });
        max(schemaPath.batteryPercentage, 100, { message: 'Max 100%' });
        required(schemaPath.estimatedRangeKm, { message: 'Range is required' });
        min(schemaPath.estimatedRangeKm, 1, { message: 'Min 1 km' });
    }, {
        submission: {
            action: async () => {
                const value = this.vehicleForm().value();
                const payload: AddVehicleRequest = {
                    model: value.model.trim(),
                    vin: value.vin.trim(),
                    status: this.status(),
                    batteryPercentage: Math.round(Number(value.batteryPercentage)),
                    estimatedRangeKm: Math.round(Number(value.estimatedRangeKm)),
                    year: value.year ? Number(value.year) : undefined,
                    color: value.color.trim() || undefined,
                };
                this.dialogRef.close(payload);
            },
        },
    });
}