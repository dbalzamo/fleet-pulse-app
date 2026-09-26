import { Component, input, output } from '@angular/core';
import { ACTIVE_VEHICLE_STATUS_COLORS, ACTIVE_VEHICLE_STATUS_COLORS_BG, ACTIVE_VEHICLE_STATUS_COLORS_TEXT, ACTIVE_VEHICLE_STATUS_LABELS, ActiveVehicle, ActiveVehicleStatus } from '../../../shared/models/tracking-model';

@Component({
    selector: 'app-active-vehicle-cell',
    templateUrl: './active-vehicle-card.html',
    styleUrl: './active-vehicle-card.scss',
})
export class ActiveVehicleCardComponent {
    readonly vehicle = input.required<ActiveVehicle>();
    readonly selected = input(false);

    readonly select = output<ActiveVehicle>();

    protected readonly statusLabels = ACTIVE_VEHICLE_STATUS_LABELS;

    protected statusColor(status: ActiveVehicleStatus): string {
        return ACTIVE_VEHICLE_STATUS_COLORS[status];
    }

    protected statusBg(status: ActiveVehicleStatus): string {
        return ACTIVE_VEHICLE_STATUS_COLORS_BG[status];
    }

    protected statusText(status: ActiveVehicleStatus): string {
        return ACTIVE_VEHICLE_STATUS_COLORS_TEXT[status];
    }

    protected batteryLow(): boolean {
        return (this.vehicle().batteryPercentage ?? 100) <= 20;
    }
}