import { Component, computed, input } from '@angular/core';
import { LOW_BATTERY_THRESHOLD, VehicleDetail } from '../../../../shared/models/vehicle-model';
import { formatKm } from '../../../../shared/utils/date';

@Component({
    selector: 'app-vehicle-battery-section',
    templateUrl: './vehicle-battery-section.html',
    styleUrl: './vehicle-battery-section.scss',
})
export class VehicleBatterySectionComponent {
    readonly vehicle = input.required<VehicleDetail>();
    readonly lowThreshold = input(LOW_BATTERY_THRESHOLD);

    protected readonly isLowBattery = computed(
        () => this.vehicle().batteryPercentage < this.lowThreshold()
    );

    protected readonly rangeLabel = computed(() => formatKm(this.vehicle().estimatedRangeKm));
}