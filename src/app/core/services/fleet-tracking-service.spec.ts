import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActiveVehicle } from '../../shared/models/tracking-model';
import { FleetTrackingService } from './fleet-tracking-service';
import { MockFleetTrackingService } from './mock-fleet-tracking-service';
import { RealtimeFleetTrackingService } from './realtime-fleet-tracking-service';

describe('MockFleetTrackingService', () => {
  let service: FleetTrackingService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: FleetTrackingService, useClass: MockFleetTrackingService }],
    });
    service = TestBed.inject(FleetTrackingService);
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  it('starts connected and emits a plausible fleet of 5–8 vehicles inside the mapped area', () => {
    service.start();

    const fleet = service.positions();
    expect(service.status()).toBe('connected');
    expect(fleet.length).toBeGreaterThanOrEqual(5);
    expect(fleet.length).toBeLessThanOrEqual(8);

    const inService = fleet.filter((v) => v.status === 'in_service').length;
    const attention = fleet.filter((v) => v.status === 'attention').length;
    const emergency = fleet.filter((v) => v.status === 'emergency').length;
    expect(inService).toBeGreaterThan(attention);
    expect(emergency).toBeLessThanOrEqual(1);

    for (const vehicle of fleet) {
      expect(vehicle.id).toMatch(/^RT-\d{4}$/);
      expect(vehicle.batteryPercentage).toBeGreaterThan(0);
      expect(vehicle.batteryPercentage).toBeLessThanOrEqual(100);
      expect(vehicle.heading).toBeGreaterThanOrEqual(0);
      expect(vehicle.heading).toBeLessThan(360);
      expect(vehicle.longitude).toBeGreaterThan(9.1);
      expect(vehicle.longitude).toBeLessThan(9.3);
    }
  });

  it('moves every vehicle with a small bounded step on each tick', async () => {
    service.start();
    await vi.advanceTimersByTimeAsync(10);
    const first = service.positions();

    await vi.advanceTimersByTimeAsync(6300);
    const second = service.positions();

    expect(second.length).toBe(first.length);
    const moved = second.some(
      (vehicle: ActiveVehicle, index: number) =>
        vehicle.latitude !== first[index].latitude || vehicle.longitude !== first[index].longitude
    );
    expect(moved).toBe(true);

    for (let index = 0; index < first.length; index += 1) {
      const deltaLat = Math.abs(second[index].latitude - first[index].latitude);
      const deltaLng = Math.abs(second[index].longitude - first[index].longitude);
      expect(deltaLat).toBeLessThan(0.001);
      expect(deltaLng).toBeLessThan(0.001);
    }
  });

  it('drains the battery of in-service vehicles over time', async () => {
    service.start();
    await vi.advanceTimersByTimeAsync(10);
    const first = service.positions();

    await vi.advanceTimersByTimeAsync(6300);
    const second = service.positions();

    for (let index = 0; index < first.length; index += 1) {
      if (first[index].status === 'in_service') {
        expect(second[index].batteryPercentage).toBeLessThanOrEqual(first[index].batteryPercentage);
      }
    }
    expect(second.some((v, i) => v.batteryPercentage < first[i].batteryPercentage)).toBe(true);
  });

  it('stops the update loop when stop() is called (no background timers)', async () => {
    service.start();
    await vi.advanceTimersByTimeAsync(10);
    const frozen = service.positions();

    service.stop();
    expect(service.status()).toBe('disconnected');

    await vi.advanceTimersByTimeAsync(15000);
    expect(service.positions()).toEqual(frozen);
  });

  it('emits the same snapshots through the vehicles$ observable', async () => {
    const emissions: ActiveVehicle[][] = [];
    const subscription = service.vehicles$.subscribe((vehicles) => emissions.push(vehicles));

    service.start();
    await vi.advanceTimersByTimeAsync(10);

    expect(emissions.length).toBeGreaterThan(0);
    expect(emissions[emissions.length - 1]).toEqual(service.positions());
    subscription.unsubscribe();
  });
});

describe('RealtimeFleetTrackingService', () => {
  let service: FleetTrackingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FleetTrackingService, useClass: RealtimeFleetTrackingService },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(FleetTrackingService);
  });

  afterEach(() => {
    service.stop();
    httpMock.verify();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function stubUnavailableWebSocket(): void {
    vi.stubGlobal(
      'WebSocket',
      class {
        constructor() {
          throw new Error('realtime unavailable');
        }
      } as unknown as typeof WebSocket
    );
  }

  it('falls back to HTTP polling when the websocket cannot connect', () => {
    stubUnavailableWebSocket();
    service.start();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/vehicles/tracking');
    expect(service.status()).toBe('polling');
    const payload: ActiveVehicle[] = [
      {
        id: 'RT-1001',
        status: 'in_service',
        latitude: 45.47,
        longitude: 9.2,
        heading: 90,
        batteryPercentage: 80,
        etaMinutes: 12,
        remainingDistanceKm: 6.4,
      },
    ];
    req.flush(payload);
    expect(service.positions()).toEqual(payload);
  });

  it('marks the feed disconnected when polling also fails', () => {
    stubUnavailableWebSocket();
    service.start();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/vehicles/tracking');
    req.error(new ProgressEvent('error'), { status: 500 });
    expect(service.status()).toBe('disconnected');
  });

  it('stops polling when stop() is called', () => {
    stubUnavailableWebSocket();
    service.start();

    httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/vehicles/tracking').flush([]);
    service.stop();
    expect(service.status()).toBe('disconnected');

    service.start();
    httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/vehicles/tracking').flush([]);
  });
});