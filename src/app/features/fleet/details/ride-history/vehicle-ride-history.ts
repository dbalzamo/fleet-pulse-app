import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
    RIDE_OUTCOME_COLORS,
    RIDE_OUTCOME_COLORS_BG,
    RIDE_OUTCOME_COLORS_TEXT,
    RIDE_OUTCOME_LABELS,
    RideHistoryEntry,
    RideOutcome,
} from '../../../../shared/models/vehicle-model';
import { formatIsoDate } from '../../../../shared/utils/date';

@Component({
    selector: 'app-vehicle-ride-history',
    imports: [MatButtonModule, MatProgressSpinnerModule],
    templateUrl: './vehicle-ride-history.html',
    styleUrl: './vehicle-ride-history.scss',
})
export class VehicleRideHistoryComponent {
    readonly rides = input.required<RideHistoryEntry[]>();
    readonly totalElements = input(0);
    readonly loading = input(false);
    readonly error = input<string | null>(null);

    readonly loadMore = output<void>();

    protected readonly outcomeLabels = RIDE_OUTCOME_LABELS;

    protected hasMore(): boolean {
        return this.rides().length < this.totalElements();
    }

    protected outcomeColor(outcome: RideOutcome): string {
        return RIDE_OUTCOME_COLORS[outcome];
    }

    protected outcomeBg(outcome: RideOutcome): string {
        return RIDE_OUTCOME_COLORS_BG[outcome];
    }

    protected outcomeText(outcome: RideOutcome): string {
        return RIDE_OUTCOME_COLORS_TEXT[outcome];
    }

    protected rideDate(isoDate: string): string {
        return formatIsoDate(isoDate);
    }
}