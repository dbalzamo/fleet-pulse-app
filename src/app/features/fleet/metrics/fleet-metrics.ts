import { Component, input } from '@angular/core';
import { FleetMetrics } from '../../../shared/models/vehicle-model';

@Component({
    selector: 'app-fleet-metrics',
    imports: [],
    templateUrl: './fleet-metrics.html',
    styleUrl: './fleet-metrics.scss',
})
export class FleetMetricsComponent {
    readonly metrics = input.required<FleetMetrics>();
    readonly loading = input(false);
}