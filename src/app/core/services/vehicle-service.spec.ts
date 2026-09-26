import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/envirornment-local';
import { AddVehicleRequest, FirmwareUpdateResult, MaintenanceRequest, RideHistoryPage, Vehicle, VehicleDetail, VehiclePage } from '../../shared/models/vehicle-model';
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

    it('returns the vehicle detail and null for unknown ids', async () => {
      let detail: VehicleDetail | null | undefined;
      service.getVehicleDetail('veh-001').subscribe((v) => (detail = v));
      await flushMockDelay(300);
      expect(detail?.model).toBe('Tesla Model 3');
      expect(detail?.serialNumber).toBe('5YJ3E1EAXKF000001');
      expect(detail?.batteryType).toBeDefined();

      let missing: VehicleDetail | null | undefined;
      service.getVehicleDetail('veh-unknown').subscribe((v) => (missing = v));
      await flushMockDelay(300);
      expect(missing).toBeNull();
    });

    it('paginates ride history', async () => {
      let page: RideHistoryPage | undefined;
      service.getRideHistory('veh-001', 0).subscribe((res) => (page = res));
      await flushMockDelay(300);
      expect(page!.content).toHaveLength(5);
      expect(page!.totalElements).toBe(12);

      let lastPage: RideHistoryPage | undefined;
      service.getRideHistory('veh-001', 2).subscribe((res) => (lastPage = res));
      await flushMockDelay(300);
      expect(lastPage!.content).toHaveLength(2);
    });

    it('schedules maintenance and exposes the new date on the detail', async () => {
      const request: MaintenanceRequest = { date: '2026-12-01', type: 'Routine service' };
      let done = false;
      service.scheduleMaintenance('veh-001', request).subscribe(() => (done = true));
      await flushMockDelay(350);
      expect(done).toBe(true);

      let detail: VehicleDetail | null | undefined;
      service.getVehicleDetail('veh-001').subscribe((v) => (detail = v));
      await flushMockDelay(300);
      expect(detail?.nextMaintenanceDate).toBe('2026-12-01');
    });

    it('runs the firmware lifecycle until completion', async () => {
      let started: FirmwareUpdateResult | undefined;
      service.startFirmwareUpdate('veh-001').subscribe((r) => (started = r));
      await flushMockDelay(250);
      expect(started?.status).toBe('in_progress');

      let firstStatus: FirmwareUpdateResult | undefined;
      service.getFirmwareStatus('veh-001', started!.jobId).subscribe((r) => (firstStatus = r));
      await flushMockDelay(200);
      expect(firstStatus?.status).toBe('in_progress');

      let finalStatus: FirmwareUpdateResult | undefined;
      service.getFirmwareStatus('veh-001', started!.jobId).subscribe((r) => (finalStatus = r));
      await flushMockDelay(200);
      expect(finalStatus?.status).toBe('completed');
    });

    it('cancels an in-progress firmware job and reports failed for unknown jobs', async () => {
      let started: FirmwareUpdateResult | undefined;
      service.startFirmwareUpdate('veh-001').subscribe((r) => (started = r));
      await flushMockDelay(250);

      let cancelled: FirmwareUpdateResult | undefined;
      service.cancelFirmwareUpdate('veh-001', started!.jobId).subscribe((r) => (cancelled = r));
      await flushMockDelay(200);
      expect(cancelled?.status).toBe('cancelled');

      let unknown: FirmwareUpdateResult | undefined;
      service.getFirmwareStatus('veh-001', 'fw-missing').subscribe((r) => (unknown = r));
      await flushMockDelay(200);
      expect(unknown?.status).toBe('failed');
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

    it('GETs the vehicle detail by id', () => {
      service.getVehicleDetail('veh-1').subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === `${baseUrl}/veh-1`);
      req.flush({ id: 'veh-1', serialNumber: 'TESTVIN12345', batteryType: 'LFP 74 kWh' });
    });

    it('GETs ride history with the page param', () => {
      service.getRideHistory('veh-1', 2).subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === `${baseUrl}/veh-1/rides`);
      expect(req.request.params.get('page')).toBe('2');
      req.flush({ content: [], totalElements: 0 });
    });

    it('POSTs a maintenance request', () => {
      const request: MaintenanceRequest = { date: '2026-12-01', type: 'Routine service' };
      service.scheduleMaintenance('veh-1', request).subscribe();
      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url === `${baseUrl}/veh-1/maintenance`);
      expect(req.request.body).toEqual(request);
      req.flush(null);
    });

    it('POSTs to start a firmware update', () => {
      service.startFirmwareUpdate('veh-1').subscribe();
      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url === `${baseUrl}/veh-1/firmware-update`);
      req.flush({ jobId: 'fw-1', status: 'in_progress' });
    });

    it('GETs the firmware update status', () => {
      service.getFirmwareStatus('veh-1', 'fw-1').subscribe();
      const req = httpMock.expectOne(
        (r) => r.method === 'GET' && r.url === `${baseUrl}/veh-1/firmware-update/fw-1`
      );
      req.flush({ jobId: 'fw-1', status: 'completed' });
    });

    it('POSTs to cancel a firmware update', () => {
      service.cancelFirmwareUpdate('veh-1', 'fw-1').subscribe();
      const req = httpMock.expectOne(
        (r) => r.method === 'POST' && r.url === `${baseUrl}/veh-1/firmware-update/cancel`
      );
      req.flush({ jobId: 'fw-1', status: 'cancelled' });
    });
  });
});