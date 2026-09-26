import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VEHICLE_STATUS_COLORS, VEHICLE_STATUS_COLORS_BG, VEHICLE_STATUS_COLORS_TEXT, VEHICLE_STATUS_LABELS, Vehicle, VehicleStatus } from '../../../shared/models/vehicle-model';

@Component({
    selector: 'app-vehicle-card',
    imports: [MatButtonModule, MatProgressSpinnerModule],
    templateUrl: './vehicle-card.html',
    styleUrl: './vehicle-card.scss',
})
export class VehicleCardComponent {
    readonly vehicle = input.required<Vehicle>();
    readonly removing = input(false);

    readonly details = output<Vehicle>();
    readonly remove = output<Vehicle>();

    protected readonly statusLabels = VEHICLE_STATUS_LABELS;

    protected statusColor(status: VehicleStatus): string {
        return VEHICLE_STATUS_COLORS[status];
    }

    protected statusBg(status: VehicleStatus): string {
        return VEHICLE_STATUS_COLORS_BG[status];
    }

    protected statusText(status: VehicleStatus): string {
        return VEHICLE_STATUS_COLORS_TEXT[status];
    }

    protected onDetails(): void {
        if (this.removing()) {
            return;
        }
        this.details.emit(this.vehicle());
    }

    protected onRemove(): void {
        if (this.removing()) {
            return;
        }
        this.remove.emit(this.vehicle());
    }
}