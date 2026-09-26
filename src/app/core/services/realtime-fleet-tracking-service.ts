import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, Subject, Subscription, catchError, filter, interval, of, startWith, switchMap, tap, timer } from 'rxjs';
import { environment } from '../../../environments/envirornment-local';
import { ActiveVehicle, TrackingConnectionStatus } from '../../shared/models/tracking-model';
import { FleetTrackingService } from './fleet-tracking-service';

const POLL_INTERVAL_MS = 6000;
const RECONNECT_RETRY_MS = 10000;
const RECONNECT_BACKOFF_MS = 3000;

/**
 * Real fleet feed: WebSocket stream with an HTTP polling fallback and
 * exponential backoff reconnect. Selected in `app.config.ts` whenever
 * `environment.useMock` is `false`.
 */
@Service()
export class RealtimeFleetTrackingService extends FleetTrackingService {
    override readonly positions = signal<ActiveVehicle[]>([]);
    override readonly status = signal<TrackingConnectionStatus>('connecting');

    override readonly vehicles$: Observable<ActiveVehicle[]>;

    private readonly http = inject(HttpClient);
    private readonly feed$ = new Subject<ActiveVehicle[]>();

    private readonly wsUrl = `${environment.apiPath}/ws/fleet-tracking`;
    private readonly pollingUrl = `${environment.apiPath}${environment.apiUrlVehicles}/tracking`;

    private stream?: Subscription;

    constructor() {
        super();
        this.vehicles$ = this.feed$.asObservable();
    }

    override start(): void {
        if (this.stream) {
            return;
        }
        this.stream = this.createRealtimeStream().subscribe({
            next: (vehicles) => {
                this.positions.set(vehicles);
                this.feed$.next(vehicles);
            },
        });
    }

    override stop(): void {
        this.stream?.unsubscribe();
        this.stream = undefined;
        this.status.set('disconnected');
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
            const list = Array.isArray(parsed) ? parsed : (parsed as { vehicles?: unknown } | null)?.vehicles;
            return Array.isArray(list) ? (list as ActiveVehicle[]) : null;
        } catch {
            return null;
        }
    }
}