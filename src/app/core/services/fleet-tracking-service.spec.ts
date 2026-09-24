import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/envirornment-local';
import { ActiveVehicle } from '../../shared/models/tracking-model';
import { FleetTrackingService } from './fleet-tracking-service';

describe('FleetTrackingService', () => {
  let service: FleetTrackingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    environment.useMock = true;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('mock mode', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      environment.useMock = true;
      service = TestBed.inject(FleetTrackingService);
    });

    it('starts in connected state and emits an initial set of vehicles', async () => {
      expect(service.status()).toBe('connected');
      await vi.advanceTimersByTimeAsync(10);
      expect(service.positions().length).toBeGreaterThanOrEqual(3);
    });

    it('moves vehicle coordinates on every tick', async () => {
      await vi.advanceTimersByTimeAsync(10);
      const first = service.positions();
      await vi.advanceTimersByTimeAsync(2600);
      const second = service.positions();

      expect(second.length).toBe(first.length);
      const moved = second.some(
        (vehicle: ActiveVehicle, index: number) =>
          vehicle.latitude !== first[index].latitude || vehicle.longitude !== first[index].longitude
      );
      expect(moved).toBe(true);
    });
  });

  describe('realtime mode fallback', () => {
    it('falls back to HTTP polling when the websocket cannot connect', () => {
      vi.useFakeTimers();
      environment.useMock = false;
      vi.stubGlobal(
        'WebSocket',
        class {
          constructor() {
            throw new Error('realtime unavailable');
          }
        } as unknown as typeof WebSocket
      );

      service = TestBed.inject(FleetTrackingService);

      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/vehicles/tracking');
      expect(service.status()).toBe('polling');
      const payload: ActiveVehicle[] = [
        {
          id: 'veh-001',
          status: 'in_service',
          latitude: 45.47,
          longitude: 9.2,
          etaMinutes: 12,
          remainingDistanceKm: 6.4,
        },
      ];
      req.flush(payload);
      expect(service.positions()).toEqual(payload);
    });

    it('marks the feed disconnected when polling also fails', () => {
      vi.useFakeTimers();
      environment.useMock = false;
      vi.stubGlobal(
        'WebSocket',
        class {
          constructor() {
            throw new Error('realtime unavailable');
          }
        } as unknown as typeof WebSocket
      );

      service = TestBed.inject(FleetTrackingService);

      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/vehicles/tracking');
      req.error(new ProgressEvent('error'), { status: 500 });
      expect(service.status()).toBe('disconnected');
    });
  });
});