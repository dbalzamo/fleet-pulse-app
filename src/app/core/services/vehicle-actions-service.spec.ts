import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/envirornment-local';
import { EmergencyAction, VehicleActionResult } from '../../shared/models/tracking-model';
import { VehicleActionsService } from './vehicle-actions-service';

describe('VehicleActionsService', () => {
  let service: VehicleActionsService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiPath + environment.apiUrlVehicles;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VehicleActionsService);
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

    it('resolves with an accepted result for the requested action', async () => {
      let result: VehicleActionResult | undefined;
      service.executeAction('veh-001', 'emergency_stop').subscribe((res) => (result = res));
      await vi.advanceTimersByTimeAsync(800);
      expect(result).toEqual({ vehicleId: 'veh-001', action: 'emergency_stop', status: 'accepted' });
    });
  });

  describe('http mode', () => {
    beforeEach(() => {
      environment.useMock = false;
    });

    it('POSTs the selected action body to the vehicle actions endpoint', () => {
      service.executeAction('veh-002', 'return_to_depot').subscribe();
      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url === `${baseUrl}/veh-002/actions`);
      expect(req.request.body).toEqual({ action: 'return_to_depot' });
      req.flush({ vehicleId: 'veh-002', action: 'return_to_depot', status: 'accepted' });
    });

    it('sends the body that matches the action being selected', () => {
      const actions: EmergencyAction[] = ['maintenance', 'send_operator', 'return_to_depot', 'emergency_stop'];
      for (const action of actions) {
        service.executeAction('veh-1', action).subscribe();
        const req = httpMock.expectOne((r) => r.method === 'POST' && r.url === `${baseUrl}/veh-1/actions`);
        expect(req.request.body).toEqual({ action });
        req.flush({ vehicleId: 'veh-1', action, status: 'accepted' });
      }
    });
  });
});