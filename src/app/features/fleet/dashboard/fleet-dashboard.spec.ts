import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../core/services/notification-service';
import { VehicleService } from '../../../core/services/vehicle-service';
import { Vehicle } from '../../../shared/models/vehicle-model';
import { FleetDashboard } from './fleet-dashboard';

describe('FleetDashboard', () => {
  let fixture: ComponentFixture<FleetDashboard>;
  let component: FleetDashboard;
  let vehicleServiceMock: {
    getVehicles: ReturnType<typeof vi.fn>;
    createVehicle: ReturnType<typeof vi.fn>;
    deleteVehicle: ReturnType<typeof vi.fn>;
  };
  let notificationMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const vehicles: Vehicle[] = [
    {
      id: 'veh-1',
      model: 'Tesla Model 3',
      vin: '5YJ3E1EAXKF000001',
      status: 'available',
      batteryPercentage: 90,
      estimatedRangeKm: 480,
    },
    {
      id: 'veh-2',
      model: 'NIO ET7',
      vin: 'LVGAEEEE5PR000002',
      status: 'charging',
      batteryPercentage: 40,
      estimatedRangeKm: 210,
    },
  ];

  beforeEach(async () => {
    vi.useFakeTimers();
    vehicleServiceMock = {
      getVehicles: vi.fn().mockReturnValue(of({ content: vehicles, totalElements: 2 })),
      createVehicle: vi.fn().mockReturnValue(of(vehicles[0])),
      deleteVehicle: vi.fn().mockReturnValue(of(undefined)),
    };
    notificationMock = { success: vi.fn(), error: vi.fn() };
    dialogMock = { open: vi.fn() };
    routerMock = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FleetDashboard],
      providers: [
        { provide: VehicleService, useValue: vehicleServiceMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createComponent(): Promise<ComponentFixture<FleetDashboard>> {
    const f = TestBed.createComponent(FleetDashboard);
    component = f.componentInstance;
    f.detectChanges();
    await vi.advanceTimersByTimeAsync(350);
    f.detectChanges();
    return f;
  }

  function setDialogResult(result: unknown): void {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(result) });
  }

  function findButton(label: string): HTMLButtonElement {
    return (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes(label)) as HTMLButtonElement;
  }

  it('loads vehicles and renders the metrics and cards', async () => {
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('app-vehicle-card').length).toBe(2);
    expect(el.textContent).toContain('Tesla Model 3');
    expect(el.textContent).toContain('NIO ET7');
    expect(el.textContent).toContain('Showing 2 of 2 vehicles');
    expect(el.textContent).toContain('65%');
  });

  it('requests the list with the debounced search and status filters', async () => {
    fixture = await createComponent();
    component['searchQuery'].set('nio');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(350);
    fixture.detectChanges();

    const lastCall = vehicleServiceMock.getVehicles.mock.calls.at(-1)?.[0];
    expect(lastCall.search).toBe('nio');
    expect(lastCall.status).toBe('all');
  });

  it('shows the empty state and a reset shortcut when no vehicle matches', async () => {
    vehicleServiceMock.getVehicles.mockReturnValue(of({ content: [], totalElements: 0 }));
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Your fleet is empty.');
  });

  it('shows the error message and reloads on retry', async () => {
    vehicleServiceMock.getVehicles.mockReturnValue(throwError(() => new Error('boom')));
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Unable to load vehicles');

    const retry = findButton('Retry');
    expect(retry).toBeTruthy();
    retry.click();
    fixture.detectChanges();
    expect(vehicleServiceMock.getVehicles).toHaveBeenCalledTimes(2);
  });

  it('tracks and resets active filters', async () => {
    fixture = await createComponent();
    expect(component['isFiltersActive']()).toBe(false);

    const reset = findButton('Reset');
    expect(reset.disabled).toBe(true);

    component['searchQuery'].set('nio');
    fixture.detectChanges();
    expect(component['isFiltersActive']()).toBe(true);
    expect(reset.disabled).toBe(false);

    reset.click();
    fixture.detectChanges();
    expect(component['searchQuery']()).toBe('');
    expect(component['isFiltersActive']()).toBe(false);
  });

  it('navigates to the vehicle details page', async () => {
    fixture = await createComponent();
    findButton('Details').click();
    expect(routerMock.navigate).toHaveBeenCalledWith(['fleet', 'veh-1']);
  });

  it('opens the add dialog and creates the vehicle when confirmed', async () => {
    const newVehicle: Vehicle = {
      id: 'veh-9',
      model: 'Lucid Air',
      vin: '50JZABABXK0000009',
      status: 'available',
      batteryPercentage: 78,
      estimatedRangeKm: 612,
    };
    setDialogResult(newVehicle);
    fixture = await createComponent();

    findButton('Add Vehicle').click();
    await vi.advanceTimersByTimeAsync(400);
    fixture.detectChanges();

    expect(dialogMock.open).toHaveBeenCalled();
    expect(vehicleServiceMock.createVehicle).toHaveBeenCalledWith(newVehicle);
    expect(notificationMock.success).toHaveBeenCalled();
  });

  it('does nothing when the add dialog is dismissed', async () => {
    setDialogResult(undefined);
    fixture = await createComponent();

    findButton('Add Vehicle').click();
    await vi.advanceTimersByTimeAsync(400);

    expect(vehicleServiceMock.createVehicle).not.toHaveBeenCalled();
  });

  it('deletes the vehicle when the removal is confirmed', async () => {
    setDialogResult(true);
    fixture = await createComponent();

    findButton('Remove').click();
    await vi.advanceTimersByTimeAsync(400);
    fixture.detectChanges();

    expect(vehicleServiceMock.deleteVehicle).toHaveBeenCalledWith('veh-1');
    expect(notificationMock.success).toHaveBeenCalled();
  });

  it('keeps the vehicle when the removal is cancelled', async () => {
    setDialogResult(false);
    fixture = await createComponent();

    findButton('Remove').click();
    await vi.advanceTimersByTimeAsync(400);

    expect(vehicleServiceMock.deleteVehicle).not.toHaveBeenCalled();
  });
});