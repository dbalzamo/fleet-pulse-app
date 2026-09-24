import { Component, computed, effect, inject, signal } from '@angular/core';
import { FleetTrackingService } from '../../core/services/fleet-tracking-service';
import { CONNECTION_LABELS, ActiveVehicle } from '../../shared/models/tracking-model';
import { EmergencyActionsPanelComponent } from './actions/emergency-actions-panel';
import { FleetMapComponent } from './fleet-map/fleet-map';
import { ActiveVehicleListComponent } from './vehicle-list/active-vehicle-list';

@Component({
    selector: 'app-control-center',
    imports: [FleetMapComponent, ActiveVehicleListComponent, EmergencyActionsPanelComponent],
    templateUrl: './control-center.html',
    styleUrl: './control-center.scss',
})
export class ControlCenterComponent {
    private readonly tracking = inject(FleetTrackingService);

    protected readonly vehicles = this.tracking.positions;
    protected readonly connectionStatus = this.tracking.status;
    protected readonly connectionLabel = computed(() => CONNECTION_LABELS[this.connectionStatus()]);

    protected readonly selectedVehicle = signal<ActiveVehicle | null>(null);
    protected readonly selectedVehicleId = computed(() => this.selectedVehicle()?.id ?? null);

    constructor() {
        effect(() => {
            const vehicles = this.vehicles();
            const selected = this.selectedVehicle();
            if (selected && !vehicles.some((v) => v.id === selected.id)) {
                this.selectedVehicle.set(null);
            }
        });
    }

    protected selectVehicle(vehicle: ActiveVehicle): void {
        this.selectedVehicle.set(vehicle);
    }
}