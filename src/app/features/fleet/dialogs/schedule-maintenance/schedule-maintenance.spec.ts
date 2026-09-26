import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MaintenanceRequest } from '../../../../shared/models/vehicle-model';
import { todayIsoDate } from '../../../../shared/utils/date';
import { ScheduleMaintenanceComponent } from './schedule-maintenance';

describe('ScheduleMaintenanceComponent', () => {
  let fixture: ComponentFixture<ScheduleMaintenanceComponent>;
  let component: ScheduleMaintenanceComponent;
  const dialogRefMock = { close: vi.fn() };

  beforeEach(async () => {
    dialogRefMock.close.mockClear();
    await TestBed.configureTestingModule({
      imports: [ScheduleMaintenanceComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleMaintenanceComponent);
    component = fixture.componentInstance;
  });

  it('starts invalid with the submit button disabled', () => {
    fixture.detectChanges();
    const form = component['maintenanceForm'];
    expect(form().invalid()).toBe(true);
    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('rejects a maintenance date that is in the past', () => {
    const form = component['maintenanceForm'];
    fixture.detectChanges();

    form.date().value.set('2020-01-01');
    form.type().value.set('Routine service');
    fixture.detectChanges();

    expect(form.date().invalid()).toBe(true);
    const messages = form.date().errors().map((e) => e.message);
    expect(messages).toContain('Date cannot be in the past');
    expect(form().invalid()).toBe(true);
  });

  it('accepts today as a valid maintenance date', () => {
    const form = component['maintenanceForm'];
    fixture.detectChanges();

    form.date().value.set(todayIsoDate());
    form.type().value.set('Brake service');
    fixture.detectChanges();

    expect(form.date().valid()).toBe(true);
    expect(form().valid()).toBe(true);
  });

  it('closes the dialog with a maintenance request when the form is valid', async () => {
    const form = component['maintenanceForm'];
    fixture.detectChanges();

    form.date().value.set('2026-11-05');
    form.type().value.set('Brake service');
    form.assignedTo().value.set('  North Depot  ');
    fixture.detectChanges();

    expect(form().valid()).toBe(true);

    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formElement.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
    const payload = dialogRefMock.close.mock.calls[0][0] as MaintenanceRequest;
    expect(payload.date).toBe('2026-11-05');
    expect(payload.type).toBe('Brake service');
    expect(payload.assignedTo).toBe('North Depot');
  });

  it('does not close the dialog when the date is in the past and submission is attempted', async () => {
    const form = component['maintenanceForm'];
    fixture.detectChanges();

    form.date().value.set('2020-01-01');
    form.type().value.set('Routine service');
    fixture.detectChanges();

    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formElement.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(form().invalid()).toBe(true);
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });
});