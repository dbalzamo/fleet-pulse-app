import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiveVehicle, TrackingConnectionStatus } from '../../shared/models/tracking-model';

/**
 * Contract for the fleet tracking feed consumed by the control center and the
 * dashboard map. Consumers always inject this token and never know whether the
 * data comes from the mock simulation or from the real backend.
 *
 * The concrete implementation is chosen in `app.config.ts`:
 * `environment.useMock ? MockFleetTrackingService : RealtimeFleetTrackingService`.
 */
export abstract class FleetTrackingService {
    /** Latest snapshot of the active vehicles, updated on every feed emission. */
    abstract readonly positions: Signal<ActiveVehicle[]>;
    /** Current connection/simulation state of the feed. */
    abstract readonly status: Signal<TrackingConnectionStatus>;
    /** Reactive stream of vehicle snapshots (same data that feeds `positions`). */
    abstract readonly vehicles$: Observable<ActiveVehicle[]>;
    /** Starts the feed. Safe to call multiple times. */
    abstract start(): void;
    /** Stops the feed and releases the update loop (timers/polling/websocket). */
    abstract stop(): void;
}