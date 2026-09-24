import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/envirornment-local';
import { AddVehicleRequest, Vehicle, VehiclePage } from '../../shared/models/vehicle-model';
import { VehicleService } from './vehicle-service';

describe('VehicleService', () => {
  let service: VehicleService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiPath + environment.apiUrlVehicles;

  const payload: AddVehicleRequest = {
    model: 'Test Car',
    vin: 'TESTVIN12345',
    status: 'available',
    batteryPercentage: 80,
    estimatedRangeKm: 300,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VehicleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    environment.useMock = true;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('mock mode', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      environment.useMock = true;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function flushMockDelay(ms: number): Promise<void> {
      await vi.advanceTimersByTimeAsync(ms);
    }

    it('returns all mock vehicles', async () => {
      let result: VehiclePage | undefined;
      service.getVehicles().subscribe((res) => (result = res));
      await flushMockDelay(400);
      expect(result).toBeDefined();
      expect(result!.content.length).toBe(8);
      expect(result!.totalElements).toBe(8);
    });

    it('filters vehicles by model search', async () => {
      let result: VehiclePage | undefined;
      service.getVehicles({ search: 'nio' }).subscribe((res) => (result = res));
      await flushMockDelay(400);
      expect(result!.content.every((v) => v.model.toLowerCase().includes('nio'))).toBe(true);
    });

    it('filters vehicles by status', async () => {
      let result: VehiclePage | undefined;
      service.getVehicles({ status: 'charging' }).subscribe((res) => (result = res));
      await flushMockDelay(400);
      expect(result!.content).toHaveLength(2);
      expect(result!.content.every((v) => v.status === 'charging')).toBe(true);
    });

    it('creates a vehicle and includes it in the list', async () => {
      let created: Vehicle | undefined;
      service.createVehicle(payload).subscribe((v) => (created = v));
      await flushMockDelay(400);
      expect(created).toBeDefined();
      expect(created!.id).toBeDefined();
      expect(created!.model).toBe('Test Car');

      let list: VehiclePage | undefined;
      service.getVehicles().subscribe((res) => (list = res));
      await flushMockDelay(400);
      expect(list!.content).toHaveLength(9);
    });

    it('deletes a vehicle and removes it from the list', async () => {
      let done = false;
      service.deleteVehicle('veh-001').subscribe(() => (done = true));
      await flushMockDelay(400);
      expect(done).toBe(true);

      let list: VehiclePage | undefined;
      service.getVehicles().subscribe((res) => (list = res));
      await flushMockDelay(400);
      expect(list!.content.find((v) => v.id === 'veh-001')).toBeUndefined();
    });

    it('returns a single vehicle by id', async () => {
      let result: Vehicle | null | undefined;
      service.getVehicle('veh-002').subscribe((v) => (result = v));
      await flushMockDelay(250);
      expect(result?.model).toBe('Tesla Model Y');
    });

    it('simulateError throws a descriptive error', () => {
      expect(() => service.simulateError()).toThrowError('Vehicle backend unreachable');
    });
  });

  describe('http mode', () => {
    beforeEach(() => {
      environment.useMock = false;
    });

    it('GETs vehicles with query params', () => {
      service.getVehicles({ search: 'tesla', status: 'available', page: 1 }).subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === baseUrl);
      expect(req.request.params.get('search')).toBe('tesla');
      expect(req.request.params.get('status')).toBe('available');
      expect(req.request.params.get('page')).toBe('1');
      req.flush({ content: [], totalElements: 0 });
    });

    it('POSTs vehicles to the create endpoint', () => {
      service.createVehicle(payload).subscribe();
      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url === baseUrl);
      expect(req.request.body).toEqual(payload);
      req.flush({ ...payload, id: 'veh-99' });
    });

    it('DELETEs a vehicle by id', () => {
      service.deleteVehicle('veh-1').subscribe();
      const req = httpMock.expectOne((r) => r.method === 'DELETE' && r.url === `${baseUrl}/veh-1`);
      req.flush(null);
    });

    it('GETs a single vehicle by id', () => {
      service.getVehicle('veh-1').subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === `${baseUrl}/veh-1`);
      req.flush({ ...payload, id: 'veh-1' });
    });
  });
});