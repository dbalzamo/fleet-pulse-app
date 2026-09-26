import { Service, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, interval, map } from 'rxjs';
import { ActiveVehicle, ActiveVehicleStatus, TrackPoint, TrackingConnectionStatus } from '../../shared/models/tracking-model';
import { FleetTrackingService } from './fleet-tracking-service';

/** Central point of the simulated area (Milan, Piazza del Duomo). */
const CENTER_LAT = 45.4642;
const CENTER_LNG = 9.19;

/** ~5 km around the centre, so vehicles stay inside a believable urban area. */
const AREA_RADIUS_DEG = 0.045;
const MIN_LAT = CENTER_LAT - AREA_RADIUS_DEG;
const MAX_LAT = CENTER_LAT + AREA_RADIUS_DEG;
const MIN_LNG = CENTER_LNG - AREA_RADIUS_DEG;
const MAX_LNG = CENTER_LNG + AREA_RADIUS_DEG;

const VEHICLE_COUNT = 6;
const TICK_MS = 3000;
const MAX_TURN_DEG = 60;
const LOW_BATTERY_PCT = 12;
const ROUTE_TRAIL_LENGTH = 6;
const AVG_TRIP_SPEED_KM_PER_MIN = 0.35;

/** How many degrees of latitude a vehicle covers per tick (≈ 12–40 m). */
const LAT_STEP_PER_TICK = 0.00022;

interface MockFleetState {
    vehicle: ActiveVehicle;
    heading: number;
    history: TrackPoint[];
}

/**
 * Mock fleet feed used while `environment.useMock` is enabled.
 *
 * Owns every piece of simulation logic: plausible initial positions near the
 * map centre, an inertia-based random walk (heading changes only slightly per
 * tick), slow battery drain, and trip progress for vehicles that are in
 * service. When the real backend is ready, switch the provider in
 * `app.config.ts` to `RealtimeFleetTrackingService` and delete this file — no
 * consumer is ever aware of which source is active.
 */
@Service()
export class MockFleetTrackingService extends FleetTrackingService {
    override readonly positions = signal<ActiveVehicle[]>([]);
    override readonly status = signal<TrackingConnectionStatus>('connecting');

    override readonly vehicles$: Observable<ActiveVehicle[]>;

    private readonly feed$ = new BehaviorSubject<ActiveVehicle[]>([]);
    private readonly fleet: MockFleetState[];
    private stream?: Subscription;

    constructor() {
        super();
        this.vehicles$ = this.feed$.asObservable();
        this.fleet = this.buildInitialFleet();
    }

    override start(): void {
        if (this.stream) {
            return;
        }
        this.status.set('connected');
        this.positions.set(this.snapshot());
        this.feed$.next(this.positions());
        this.stream = interval(TICK_MS)
            .pipe(map(() => this.tick()))
            .subscribe((vehicles) => {
                this.positions.set(vehicles);
                this.feed$.next(vehicles);
            });
    }

    override stop(): void {
        this.stream?.unsubscribe();
        this.stream = undefined;
        this.status.set('disconnected');
    }

    private buildInitialFleet(): MockFleetState[] {
        const states: MockFleetState[] = [];
        const usedIds = new Set<string>();

        for (let index = 0; index < VEHICLE_COUNT; index += 1) {
            const status: ActiveVehicleStatus =
                index === VEHICLE_COUNT - 1 ? 'emergency' : index === VEHICLE_COUNT - 2 ? 'attention' : 'in_service';
            const position = this.randomPointInArea();
            const history = [this.offset(position, 180), position];

            states.push({
                heading: this.normalizeHeading(this.randomIn(0, 360)),
                history,
                vehicle: {
                    id: this.uniqueId(usedIds),
                    status,
                    latitude: position.latitude,
                    longitude: position.longitude,
                    heading: this.roundHeading(this.randomIn(0, 360)),
                    batteryPercentage: this.initialBattery(status),
                    etaMinutes: this.etaForDistance(this.randomIn(2, 12)),
                    remainingDistanceKm: this.round1(this.randomIn(2, 12)),
                    route: history.map((point) => ({ ...point })),
                },
            });
        }
        return states;
    }

    private tick(): ActiveVehicle[] {
        for (let index = 0; index < this.fleet.length; index += 1) {
            const state = this.fleet[index];
            const vehicle = state.vehicle;

            const turn = ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 2 * MAX_TURN_DEG;
            let heading = this.normalizeHeading(state.heading + turn);
            const step = LAT_STEP_PER_TICK * this.randomIn(0.55, 1.45);

            let position = this.move(vehicle.latitude, vehicle.longitude, heading, step);
            if (position === null) {
                // About to leave the simulated area: turn around and keep moving.
                heading = this.normalizeHeading(heading + 180 + this.randomIn(-30, 30));
                position = this.move(vehicle.latitude, vehicle.longitude, heading, step) ?? {
                    latitude: vehicle.latitude,
                    longitude: vehicle.longitude,
                };
            }

            state.heading = heading;
            state.history.push(position);
            if (state.history.length > ROUTE_TRAIL_LENGTH) {
                state.history.shift();
            }

            this.fleet[index] = {
                ...state,
                vehicle: this.nextVehicle(vehicle, position, heading, state.history),
            };
        }
        return this.snapshot();
    }

    private nextVehicle(
        previous: ActiveVehicle,
        position: TrackPoint,
        heading: number,
        history: TrackPoint[]
    ): ActiveVehicle {
        const status = this.nextStatus(previous);
        const batteryPercentage = this.nextBattery(previous, status);
        const { etaMinutes, remainingDistanceKm } = this.nextTripProgress(previous, status, position);

        return {
            id: previous.id,
            status,
            latitude: position.latitude,
            longitude: position.longitude,
            heading: this.roundHeading(heading),
            batteryPercentage,
            etaMinutes,
            remainingDistanceKm,
            route: history.map((point) => ({ ...point })),
        };
    }

    private nextStatus(previous: ActiveVehicle): ActiveVehicleStatus {
        if (previous.status === 'in_service' && previous.batteryPercentage <= LOW_BATTERY_PCT) {
            return 'attention';
        }
        return previous.status;
    }

    private nextBattery(previous: ActiveVehicle, status: ActiveVehicleStatus): number {
        if (status === 'in_service') {
            return this.round1(Math.max(2, previous.batteryPercentage - this.randomIn(0.02, 0.08)));
        }
        if (status === 'attention') {
            return this.round1(Math.max(3, previous.batteryPercentage - 0.02));
        }
        return previous.batteryPercentage;
    }

    private nextTripProgress(
        previous: ActiveVehicle,
        status: ActiveVehicleStatus,
        position: TrackPoint
    ): { etaMinutes: number; remainingDistanceKm: number } {
        if (status !== 'in_service') {
            return { etaMinutes: previous.etaMinutes, remainingDistanceKm: previous.remainingDistanceKm };
        }
        const movedKm = this.distanceKm(previous.latitude, previous.longitude, position.latitude, position.longitude);
        const remainingDistanceKm = this.round1(Math.max(0.2, previous.remainingDistanceKm - movedKm));
        return { etaMinutes: this.etaForDistance(remainingDistanceKm), remainingDistanceKm };
    }

    // ------------------------------------------------------------------
    // Pure helpers — geometry / maths, no component involvement.
    // ------------------------------------------------------------------

    private snapshot(): ActiveVehicle[] {
        return this.fleet.map((state) => state.vehicle);
    }

    private randomPointInArea(): TrackPoint {
        const angle = this.randomIn(0, 2 * Math.PI);
        const radius = Math.sqrt(Math.random()) * AREA_RADIUS_DEG;
        return {
            latitude: CENTER_LAT + Math.cos(angle) * radius,
            longitude: CENTER_LNG + (Math.sin(angle) * radius) / Math.cos((CENTER_LAT * Math.PI) / 180),
        };
    }

    private offset(point: TrackPoint, headingDeg: number): TrackPoint {
        const step = LAT_STEP_PER_TICK * 0.6;
        return this.move(point.latitude, point.longitude, headingDeg, step) ?? { ...point };
    }

    private move(lat: number, lng: number, headingDeg: number, stepDeg: number): TrackPoint | null {
        const rad = (headingDeg * Math.PI) / 180;
        const nextLat = lat + Math.cos(rad) * stepDeg;
        const nextLng = lng + (Math.sin(rad) * stepDeg) / Math.cos((lat * Math.PI) / 180);
        if (nextLat < MIN_LAT || nextLat > MAX_LAT || nextLng < MIN_LNG || nextLng > MAX_LNG) {
            return null;
        }
        return { latitude: nextLat, longitude: nextLng };
    }

    private distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
        const latDiff = (bLat - aLat) * 111;
        const lngDiff = (bLng - aLng) * 111 * Math.cos((aLat * Math.PI) / 180);
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    }

    private normalizeHeading(deg: number): number {
        return ((deg % 360) + 360) % 360;
    }

    private roundHeading(deg: number): number {
        return Math.round(this.normalizeHeading(deg) / 5) * 5;
    }

    private etaForDistance(km: number): number {
        return Math.max(1, Math.round(km / AVG_TRIP_SPEED_KM_PER_MIN));
    }

    private initialBattery(status: ActiveVehicleStatus): number {
        if (status === 'emergency') {
            return this.round1(this.randomIn(8, 18));
        }
        if (status === 'attention') {
            return this.round1(this.randomIn(12, 28));
        }
        return this.round1(this.randomIn(42, 98));
    }

    private uniqueId(used: Set<string>): string {
        let id = `RT-${Math.floor(this.randomIn(1000, 9999))}`;
        while (used.has(id)) {
            id = `RT-${Math.floor(this.randomIn(1000, 9999))}`;
        }
        used.add(id);
        return id;
    }

    private randomIn(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    private round1(value: number): number {
        return Number(value.toFixed(1));
    }
}