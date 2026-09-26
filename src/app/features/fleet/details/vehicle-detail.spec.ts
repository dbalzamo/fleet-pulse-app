import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { VehicleService } from '../../../core/services/vehicle-service';
import { FirmwareUpdateResult, RideHistoryPage, VehicleDetail } from '../../../shared/models/vehicle-model';
import { VehicleDetailComponent } from './vehicle-detail';

describe('VehicleDetailComponent', () => {
  let fixture: ComponentFixture<VehicleDetailComponent>;
  let component: VehicleDetailComponent;
  let vehicleServiceMock: {
    getVehicleDetail: ReturnType<typeof vi.fn>;
    getRideHistory: ReturnType<typeof vi.fn>;
    scheduleMaintenance: ReturnType<typeof vi.fn>;
    startFirmwareUpdate: ReturnType<typeof vi.fn>;
    getFirmwareStatus: ReturnType<typeof vi.fn>;
    cancelFirmwareUpdate: ReturnType<typeof vi.fn>;
    deleteVehicle: ReturnType<typeof vi.fn>;
  };
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const detail: VehicleDetail = {
    id: 'veh-001',
    model: 'Tesla Model 3',
    serialNumber: '5YJ3E1EAXKF000001',
    status: 'available',
    batteryPercentage: 92,
    estimatedRangeKm: 489,
    batteryType: 'LFP 74 kWh',
    lastMaintenanceDate: '2026-08-12',
    nextMaintenanceDate: '2026-10-01',
    totalKm: 15000,
    firmwareVersion: '2.4.1',
  };

  const inServiceDetail: VehicleDetail = { ...detail, id: 'veh-002', status: 'in_service' };

  const ridesPage: RideHistoryPage = {
    content: [
      { rideId: 'veh-001-ride-001', date: '2026-09-22', durationMinutes: 24, outcome: 'completed' },
      { rideId: 'veh-001-ride-002', date: '2026-09-21', durationMinutes: 15, outcome: 'cancelled' },
      { rideId: 'veh-001-ride-003', date: '2026-09-20', durationMinutes: 33, outcome: 'completed' },
      { rideId: 'veh-001-ride-004', date: '2026-09-19', durationMinutes: 12, outcome: 'interrupted' },
      { rideId: 'veh-001-ride-005', date: '2026-09-18', durationMinutes: 41, outcome: 'completed' },
    ],
    totalElements: 12,
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vehicleServiceMock = {
      getVehicleDetail: vi.fn().mockReturnValue(of(detail)),
      getRideHistory: vi.fn().mockReturnValue(of(ridesPage)),
      scheduleMaintenance: vi.fn().mockReturnValue(of(undefined)),
      startFirmwareUpdate: vi.fn().mockReturnValue(of<FirmwareUpdateResult>({ jobId: 'fw-1', status: 'in_progress' })),
      getFirmwareStatus: vi.fn().mockReturnValue(of<FirmwareUpdateResult>({ jobId: 'fw-1', status: 'completed' })),
      cancelFirmwareUpdate: vi.fn().mockReturnValue(of<FirmwareUpdateResult>({ jobId: 'fw-1', status: 'cancelled' })),
      deleteVehicle: vi.fn().mockReturnValue(of(undefined)),
    };
    dialogMock = { open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }) };
    routerMock = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [VehicleDetailComponent],
      providers: [
        { provide: VehicleService, useValue: vehicleServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createComponent(): Promise<ComponentFixture<VehicleDetailComponent>> {
    const f = TestBed.createComponent(VehicleDetailComponent);
    component = f.componentInstance;
    fixture = f;
    f.componentRef.setInput('id', detail.id);
    f.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    f.detectChanges();
    return f;
  }

  function findButton(label: string): HTMLButtonElement {
    return (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes(label)) as HTMLButtonElement;
  }

  it('loads the vehicle and renders header, battery and maintenance sections', async () => {
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(vehicleServiceMock.getVehicleDetail).toHaveBeenCalledWith('veh-001');
    expect(el.textContent).toContain('Tesla Model 3');
    expect(el.textContent).toContain('veh-001');
    expect(el.textContent).toContain('5YJ3E1EAXKF000001');
    expect(el.textContent).toContain('Available');
    expect(el.textContent).toContain('92%');
    expect(el.textContent).toContain('489 km');
    expect(el.textContent).toContain('LFP 74 kWh');
    expect(el.textContent).toContain('2.4.1');
    expect(el.querySelector('app-vehicle-battery-section')).toBeTruthy();
    expect(el.querySelector('app-vehicle-maintenance-section')).toBeTruthy();
    expect(el.querySelector('app-vehicle-ride-history')).toBeTruthy();
  });

  it('renders the loading skeleton before the detail arrives', async () => {
    vehicleServiceMock.getVehicleDetail.mockReturnValue(of(detail).pipe(delay(300)));
    fixture = TestBed.createComponent(VehicleDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', detail.id);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.vehicle-detail__skeleton')).toBeTruthy();
  });

  it('hides the skeleton and shows the error state for an unknown vehicle', async () => {
    vehicleServiceMock.getVehicleDetail.mockReturnValue(of(null));
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.vehicle-detail__skeleton')).toBeFalsy();
    expect(el.textContent).toContain('Vehicle not found');
  });

  it('treats an HTTP 404 as not found', async () => {
    vehicleServiceMock.getVehicleDetail.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    fixture = await createComponent();
    expect(fixture.nativeElement.textContent).toContain('Vehicle not found');
  });

  it('shows a generic error and reloads on retry', async () => {
    vehicleServiceMock.getVehicleDetail.mockReturnValue(throwError(() => new Error('boom')));
    fixture = await createComponent();
    expect(fixture.nativeElement.textContent).toContain('Something went wrong');

    vehicleServiceMock.getVehicleDetail.mockReturnValue(of(detail));
    findButton('Retry').click();
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    expect(vehicleServiceMock.getVehicleDetail).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Tesla Model 3');
  });

  it('loads the first ride page and appends the next one on demand', async () => {
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(vehicleServiceMock.getRideHistory).toHaveBeenCalledWith('veh-001', 0);
    expect(el.textContent).toContain('5 of 12 rides');
    expect(el.textContent).toContain('veh-001-ride-001');

    const more = findButton('Load more');
    expect(more).toBeTruthy();
    more.click();
    fixture.detectChanges();
    expect(vehicleServiceMock.getRideHistory).toHaveBeenCalledWith('veh-001', 1);
    expect(el.textContent).toContain('10 of 12 rides');
  });

  it('does not request a further page when all rides are loaded', async () => {
    vehicleServiceMock.getRideHistory.mockReturnValue(
      of({ content: ridesPage.content, totalElements: 5 })
    );
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(vehicleServiceMock.getRideHistory).toHaveBeenCalledWith('veh-001', 0);
    expect(el.textContent).not.toContain('Load more');
    expect(el.textContent).toContain('5 of 5 rides');
  });

  it('renders the ride-error message when loading rides fails', async () => {
    vehicleServiceMock.getRideHistory.mockReturnValue(throwError(() => new Error('boom')));
    fixture = await createComponent();
    expect(fixture.nativeElement.textContent).toContain('Failed to load ride history.');
  });

  it('disables removal for in_service vehicles', async () => {
    vehicleServiceMock.getVehicleDetail.mockReturnValue(of(inServiceDetail));
    fixture = await createComponent();

    const remove = findButton('Remove vehicle');
    expect(remove).toBeTruthy();
    expect(remove.disabled).toBe(true);

    remove.click();
    expect(dialogMock.open).not.toHaveBeenCalled();
  });

  it('enables removal for other statuses and navigates back after confirming', async () => {
    fixture = await createComponent();
    const remove = findButton('Remove vehicle');
    expect(remove.disabled).toBe(false);

    dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });
    remove.click();
    fixture.detectChanges();

    expect(vehicleServiceMock.deleteVehicle).toHaveBeenCalledWith('veh-001');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/fleet']);
  });

  it('keeps the vehicle when the removal dialog is dismissed', async () => {
    fixture = await createComponent();
    findButton('Remove vehicle').click();
    fixture.detectChanges();
    expect(vehicleServiceMock.deleteVehicle).not.toHaveBeenCalled();
  });

  it('opens the maintenance dialog and updates the scheduled date on confirm', async () => {
    const request = { date: '2026-11-05', type: 'Brake service', assignedTo: 'North Depot' };
    dialogMock.open.mockReturnValue({ afterClosed: () => of(request) });
    fixture = await createComponent();

    findButton('Schedule maintenance').click();
    fixture.detectChanges();

    expect(dialogMock.open).toHaveBeenCalled();
    expect(vehicleServiceMock.scheduleMaintenance).toHaveBeenCalledWith('veh-001', request);
    expect(component['detail']()?.nextMaintenanceDate).toBe('2026-11-05');
  });

  it('does nothing when the maintenance dialog is dismissed', async () => {
    fixture = await createComponent();
    findButton('Schedule maintenance').click();
    fixture.detectChanges();
    expect(vehicleServiceMock.scheduleMaintenance).not.toHaveBeenCalled();
  });

  it('starts a firmware update, shows progress and reflects completion', async () => {
    fixture = await createComponent();

    findButton('Update firmware').click();
    fixture.detectChanges();

    expect(vehicleServiceMock.startFirmwareUpdate).toHaveBeenCalledWith('veh-001');
    expect(fixture.nativeElement.textContent).toContain('Firmware update: In progress');
    expect(findButton('Cancel update')).toBeTruthy();

    await vi.advanceTimersByTimeAsync(1600);
    fixture.detectChanges();

    expect(vehicleServiceMock.getFirmwareStatus).toHaveBeenCalledWith('veh-001', 'fw-1');
    expect(fixture.nativeElement.textContent).toContain('Firmware update: Completed');
    expect(findButton('Cancel update')).toBeFalsy();
  });

  it('does not start a second firmware update while one is running', async () => {
    fixture = await createComponent();
    const update = findButton('Update firmware');
    update.click();
    update.click();
    expect(vehicleServiceMock.startFirmwareUpdate).toHaveBeenCalledTimes(1);
  });

  it('cancels a running firmware update', async () => {
    fixture = await createComponent();
    findButton('Update firmware').click();
    fixture.detectChanges();

    findButton('Cancel update').click();
    fixture.detectChanges();

    expect(vehicleServiceMock.cancelFirmwareUpdate).toHaveBeenCalledWith('veh-001', 'fw-1');
    expect(fixture.nativeElement.textContent).toContain('Firmware update: Cancelled');
  });
});