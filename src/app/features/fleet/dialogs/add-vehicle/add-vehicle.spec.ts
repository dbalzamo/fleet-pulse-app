import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { AddVehicleRequest } from '../../../../shared/models/vehicle-model';
import { AddVehicleComponent } from './add-vehicle';

describe('AddVehicleComponent', () => {
  let fixture: ComponentFixture<AddVehicleComponent>;
  let component: AddVehicleComponent;
  const dialogRefMock = { close: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddVehicleComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddVehicleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts invalid with the submit button disabled', () => {
    const form = component['vehicleForm'];
    expect(form().invalid()).toBe(true);
    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('closes the dialog with the payload when the form is valid and submitted', async () => {
    const form = component['vehicleForm'];
    form.model().value.set('Tesla Model Y');
    form.vin().value.set('7SAYGDEE2NF000002');
    form.year().value.set(2024);
    form.batteryPercentage().value.set(80);
    form.estimatedRangeKm().value.set(400);
    fixture.detectChanges();

    expect(form().valid()).toBe(true);

    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formElement.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
    const payload = dialogRefMock.close.mock.calls[0][0] as AddVehicleRequest;
    expect(payload.model).toBe('Tesla Model Y');
    expect(payload.vin).toBe('7SAYGDEE2NF000002');
    expect(payload.status).toBe('available');
    expect(payload.batteryPercentage).toBe(80);
    expect(payload.estimatedRangeKm).toBe(400);
    expect(payload.year).toBe(2024);
  });

  it('reports invalid when battery or range are out of bounds', () => {
    const form = component['vehicleForm'];
    form.model().value.set('Tesla Model Y');
    form.vin().value.set('7SAYGDEE2NF000002');
    form.batteryPercentage().value.set(150);
    form.estimatedRangeKm().value.set(0);
    fixture.detectChanges();

    expect(form().invalid()).toBe(true);
    const errorMessages = form.batteryPercentage()
      .errors()
      .map((e) => e.message);
    expect(errorMessages).toContain('Max 100%');
  });
});