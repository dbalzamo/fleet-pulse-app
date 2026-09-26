import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required, validate } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MaintenanceRequest } from '../../../../shared/models/vehicle-model';
import { todayIsoDate } from '../../../../shared/utils/date';

export interface ScheduleMaintenanceData {
    vehicleId: string;
}

export interface MaintenanceFormModel {
    date: string;
    type: string;
    assignedTo: string;
}

const INTERVENTION_TYPES: readonly string[] = [
    'Routine service',
    'Brake service',
    'Tyre replacement',
    'HV battery inspection',
    'Software check',
] as const;

@Component({
    selector: 'app-schedule-maintenance',
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
    templateUrl: './schedule-maintenance.html',
    styleUrl: './schedule-maintenance.scss',
})
export class ScheduleMaintenanceComponent {
    private readonly dialogRef = inject(MatDialogRef<ScheduleMaintenanceComponent>);

    protected readonly interventionTypes = INTERVENTION_TYPES;

    protected readonly initial = signal<MaintenanceFormModel>({
        date: todayIsoDate(),
        type: '',
        assignedTo: '',
    });

    protected readonly maintenanceForm = form(this.initial, (schemaPath) => {
        required(schemaPath.date, { message: 'Date is required' });
        validate(schemaPath.date, (ctx) => {
            const value = ctx.value();
            if (value && value < todayIsoDate()) {
                return { kind: 'pastDate', message: 'Date cannot be in the past' };
            }
            return null;
        });
        required(schemaPath.type, { message: 'Intervention type is required' });
    }, {
        submission: {
            action: async () => {
                const value = this.maintenanceForm().value();
                const payload: MaintenanceRequest = {
                    date: value.date,
                    type: value.type.trim(),
                    assignedTo: value.assignedTo.trim() || undefined,
                };
                this.dialogRef.close(payload);
            },
        },
    });
}