import { Component, input, output } from '@angular/core';
import { ActiveVehicle } from '../../../shared/models/tracking-model';
import { ActiveVehicleCardComponent } from './active-vehicle-card';

@Component({
    selector: 'app-active-vehicle-list',
    imports: [ActiveVehicleCardComponent],
    templateUrl: './active-vehicle-list.html',
    styleUrl: './active-vehicle-list.scss',
})
export class ActiveVehicleListComponent {
    readonly vehicles = input.required<ActiveVehicle[]>();
    readonly selectedVehicleId = input<string | null>(null);

    readonly select = output<ActiveVehicle>();

    protected onSelect(vehicle: ActiveVehicle): void {
        this.select.emit(vehicle);
    }
}