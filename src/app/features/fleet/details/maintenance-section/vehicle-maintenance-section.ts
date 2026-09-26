import { Component, computed, input } from '@angular/core';
import { VehicleDetail } from '../../../../shared/models/vehicle-model';
import { formatIsoDate, formatKm, isIsoDateInThePast } from '../../../../shared/utils/date';

@Component({
    selector: 'app-vehicle-maintenance-section',
    templateUrl: './vehicle-maintenance-section.html',
    styleUrl: './vehicle-maintenance-section.scss',
})
export class VehicleMaintenanceSectionComponent {
    readonly vehicle = input.required<VehicleDetail>();

    protected readonly isNextMaintenanceOverdue = computed(() =>
        isIsoDateInThePast(this.vehicle().nextMaintenanceDate)
    );

    protected readonly lastMaintenanceLabel = computed(() => formatIsoDate(this.vehicle().lastMaintenanceDate));
    protected readonly nextMaintenanceLabel = computed(() => formatIsoDate(this.vehicle().nextMaintenanceDate));
    protected readonly totalKmLabel = computed(() => formatKm(this.vehicle().totalKm));
}