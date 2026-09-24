import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, of, throwError } from 'rxjs';
import { NotificationService } from '../../../core/services/notification-service';
import { VehicleActionsService } from '../../../core/services/vehicle-actions-service';
import { ActiveVehicle, VehicleActionResult } from '../../../shared/models/tracking-model';
import { EmergencyActionsPanelComponent } from './emergency-actions-panel';

describe('EmergencyActionsPanelComponent', () => {
  let fixture: ComponentFixture<EmergencyActionsPanelComponent>;
  let component: EmergencyActionsPanelComponent;
  let actionsServiceMock: { executeAction: ReturnType<typeof vi.fn> };
  let notificationMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogMock: { open: ReturnType<typeof vi.fn> };

  const vehicle: ActiveVehicle = {
    id: 'veh-001',
    status: 'in_service',
    latitude: 45.47,
    longitude: 9.2,
    etaMinutes: 12,
    remainingDistanceKm: 6.4,
  };

  const result: VehicleActionResult = { vehicleId: 'veh-001', action: 'maintenance', status: 'accepted' };

  beforeEach(async () => {
    actionsServiceMock = { executeAction: vi.fn() };
    notificationMock = { success: vi.fn(), error: vi.fn() };
    dialogMock = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [EmergencyActionsPanelComponent],
      providers: [
        { provide: VehicleActionsService, useValue: actionsServiceMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmergencyActionsPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedVehicle', vehicle);
    fixture.detectChanges();
  });

  function findButton(label: string): HTMLButtonElement {
    return (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes(label)) as HTMLButtonElement;
  }

  function setDialogResult(value: unknown): void {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(value) });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the four actions when a vehicle is selected', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Maintenance');
    expect(el.textContent).toContain('Send operator');
    expect(el.textContent).toContain('Return to depot');
    expect(el.textContent).toContain('Emergency stop');
  });

  it('shows an empty state and no action buttons without a selected vehicle', () => {
    fixture.componentRef.setInput('selectedVehicle', null);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(findButton('Maintenance')).toBeUndefined();
    expect(el.textContent).toContain('Select a vehicle');
  });

  it('does not call the service before the user confirms', () => {
    const pending = new Subject<never>();
    dialogMock.open.mockReturnValue({ afterClosed: () => pending });
    actionsServiceMock.executeAction.mockReturnValue(of(result));

    findButton('Maintenance').click();

    expect(dialogMock.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({ vehicleId: 'veh-001', action: 'maintenance' }),
      })
    );
    expect(actionsServiceMock.executeAction).not.toHaveBeenCalled();
  });

  it('runs the action only after the confirmation dialog is closed as confirmed', () => {
    let confirm!: (value: boolean) => void;
    dialogMock.open.mockReturnValue({
      afterClosed: () =>
        new Observable<boolean>((subscriber) => {
          confirm = subscriber.next.bind(subscriber);
        }),
    });
    actionsServiceMock.executeAction.mockReturnValue(of(result));

    findButton('Maintenance').click();
    expect(actionsServiceMock.executeAction).not.toHaveBeenCalled();

    confirm(true);
    expect(actionsServiceMock.executeAction).toHaveBeenCalledWith('veh-001', 'maintenance');
  });

  it('does not run the action when the dialog is cancelled', () => {
    setDialogResult(false);
    actionsServiceMock.executeAction.mockReturnValue(of(result));

    findButton('Send operator').click();

    expect(actionsServiceMock.executeAction).not.toHaveBeenCalled();
    expect(notificationMock.success).not.toHaveBeenCalled();
  });

  it('shows a success notification when the command is accepted', () => {
    setDialogResult(true);
    actionsServiceMock.executeAction.mockReturnValue(of(result));

    findButton('Maintenance').click();

    expect(notificationMock.success).toHaveBeenCalledWith(expect.stringContaining('veh-001'));
  });

  it('shows an error notification and does not report success when the call fails', () => {
    setDialogResult(true);
    actionsServiceMock.executeAction.mockReturnValue(throwError(() => new Error('boom')));

    findButton('Maintenance').click();

    expect(notificationMock.error).toHaveBeenCalled();
    expect(notificationMock.success).not.toHaveBeenCalled();
  });

  it('disables every button while an action is in flight and re-enables them afterwards', () => {
    const pending = new Subject<VehicleActionResult>();
    setDialogResult(true);
    actionsServiceMock.executeAction.mockReturnValue(pending);

    findButton('Return to depot').click();
    fixture.detectChanges();

    expect(findButton('Emergency stop').disabled).toBe(true);
    expect(findButton('Maintenance').disabled).toBe(true);
    expect(findButton('Return to depot').disabled).toBe(true);

    pending.next(result);
    pending.complete();
    fixture.detectChanges();

    expect(findButton('Emergency stop').disabled).toBe(false);
    expect(notificationMock.success).toHaveBeenCalled();
  });

  it('visually distinguishes the emergency stop button from the others', () => {
    expect(findButton('Emergency stop').classList.contains('actions-panel__button--danger')).toBe(true);
    expect(findButton('Maintenance').classList.contains('actions-panel__button--danger')).toBe(false);
  });
});