import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, catchError, filter, interval, of, scan, startWith, switchMap, tap, timer } from 'rxjs';
import { environment } from '../../../environments/envirornment-local';
import { ActiveVehicle, TrackingConnectionStatus } from '../../shared/models/tracking-model';

const MOCK_TICK_MS = 2500;
const POLL_INTERVAL_MS = 6000;
const RECONNECT_RETRY_MS = 10000;
const RECONNECT_BACKOFF_MS = 3000;

const MOCK_VEHICLES: ActiveVehicle[] = [
    {
        id: 'veh-001',
        status: 'in_service',
        latitude: 45.4702,
        longitude: 9.1986,
        etaMinutes: 12,
        remainingDistanceKm: 6.4,
        route: [
            { latitude: 45.4702, longitude: 9.1986 },
            { latitude: 45.4721, longitude: 9.2021 },
            { latitude: 45.4697, longitude: 9.2074 },
        ],
    },
    {
        id: 'veh-002',
        status: 'attention',
        latitude: 45.4561,
        longitude: 9.1832,
        etaMinutes: 8,
        remainingDistanceKm: 4.1,
        route: [
            { latitude: 45.4561, longitude: 9.1832 },
            { latitude: 45.4539, longitude: 9.1793 },
            { latitude: 45.4491, longitude: 9.1819 },
        ],
    },
    {
        id: 'veh-007',
        status: 'in_service',
        latitude: 45.4783,
        longitude: 9.2184,
        etaMinutes: 17,
        remainingDistanceKm: 9.2,
        route: [
            { latitude: 45.4783, longitude: 9.2184 },
            { latitude: 45.4812, longitude: 9.2229 },
            { latitude: 45.4768, longitude: 9.2261 },
        ],
    },
    {
        id: 'veh-010',
        status: 'emergency',
        latitude: 45.4424,
        longitude: 9.1593,
        etaMinutes: 24,
        remainingDistanceKm: 12.8,
        route: [
            { latitude: 45.4424, longitude: 9.1593 },
            { latitude: 45.4397, longitude: 9.1558 },
            { latitude: 45.4352, longitude: 9.1573 },
        ],
    },
];

@Service()
export class FleetTrackingService {
    private readonly http = inject(HttpClient);
    private readonly destroyRef = inject(DestroyRef);

    private readonly wsUrl = `${environment.apiPath}/ws/fleet-tracking`;
    private readonly pollingUrl = `${environment.apiPath}${environment.apiUrlVehicles}/tracking`;

    readonly positions = signal<ActiveVehicle[]>([]);
    readonly status = signal<TrackingConnectionStatus>('connecting');

    readonly vehicles$: Observable<ActiveVehicle[]>;

    constructor() {
        this.vehicles$ = environment.useMock ? this.createMockStream() : this.createRealtimeStream();
        this.vehicles$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (vehicles) => this.positions.set(vehicles),
        });
    }

    private createMockStream(): Observable<ActiveVehicle[]> {
        this.status.set('connected');
        return timer(0, MOCK_TICK_MS).pipe(
            scan((vehicles) => this.simulateTick(vehicles), MOCK_VEHICLES)
        );
    }

    private simulateTick(vehicles: ActiveVehicle[]): ActiveVehicle[] {
        return vehicles.map((vehicle) => ({
            ...vehicle,
            latitude: this.clamp(vehicle.latitude + (Math.random() - 0.45) * 0.0008, 45.42, 45.5),
            longitude: this.clamp(vehicle.longitude + (Math.random() - 0.45) * 0.0008, 9.1, 9.3),
            etaMinutes: Math.max(2, vehicle.etaMinutes - 1 + (Math.random() < 0.35 ? 2 : 0)),
            remainingDistanceKm: Number(Math.max(0.2, vehicle.remainingDistanceKm - 0.08).toFixed(1)),
            route: vehicle.route?.map((point) => ({ ...point })),
        }));
    }

    private createRealtimeStream(): Observable<ActiveVehicle[]> {
        return new Observable<ActiveVehicle[]>((subscriber) => {
            let socket: WebSocket | null = null;
            let polling: Subscription | null = null;
            let reconnectToken: number | null = null;
            let everOpened = false;
            let attempts = 0;
            let stopped = false;

            const stopPolling = (): void => {
                polling?.unsubscribe();
                polling = null;
            };

            const startPolling = (): void => {
                this.status.set('polling');
                stopPolling();
                polling = interval(POLL_INTERVAL_MS)
                    .pipe(
                        startWith(0),
                        switchMap(() =>
                            this.http.get<ActiveVehicle[]>(this.pollingUrl).pipe(
                                catchError(() => {
                                    if (this.status() !== 'connected') {
                                        this.status.set('disconnected');
                                    }
                                    return of();
                                }),
                                filter((vehicles): vehicles is ActiveVehicle[] => Array.isArray(vehicles)),
                                tap(() => this.status.set('polling'))
                            )
                        )
                    )
                    .subscribe({ next: (vehicles) => subscriber.next(vehicles) });
            };

            const scheduleReconnect = (): void => {
                if (stopped || reconnectToken !== null) {
                    return;
                }
                const delayMs = everOpened ? RECONNECT_BACKOFF_MS * Math.min(attempts, 5) : RECONNECT_RETRY_MS;
                reconnectToken = window.setTimeout(connect, delayMs);
            };

            const connect = (): void => {
                if (stopped || socket !== null) {
                    return;
                }
                this.status.set('connecting');
                attempts += 1;
                try {
                    socket = new WebSocket(this.wsUrl);
                } catch {
                    socket = null;
                    startPolling();
                    scheduleReconnect();
                    return;
                }
                socket.onopen = (): void => {
                    everOpened = true;
                    attempts = 0;
                    this.status.set('connected');
                    stopPolling();
                };
                socket.onmessage = (event: MessageEvent): void => {
                    const vehicles = this.parsePayload(event.data);
                    if (vehicles) {
                        subscriber.next(vehicles);
                    }
                };
                socket.onerror = (): void => {
                    socket?.close();
                };
                socket.onclose = (): void => {
                    socket = null;
                    if (stopped) {
                        return;
                    }
                    startPolling();
                    scheduleReconnect();
                };
            };

            connect();

            return (): void => {
                stopped = true;
                if (reconnectToken !== null) {
                    window.clearTimeout(reconnectToken);
                }
                stopPolling();
                if (socket) {
                    socket.onclose = null;
                    socket.close();
                    socket = null;
                }
            };
        });
    }

    private parsePayload(data: unknown): ActiveVehicle[] | null {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            const list = Array.isArray(parsed) ? parsed : parsed?.vehicles;
            return Array.isArray(list) ? (list as ActiveVehicle[]) : null;
        } catch {
            return null;
        }
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }
}