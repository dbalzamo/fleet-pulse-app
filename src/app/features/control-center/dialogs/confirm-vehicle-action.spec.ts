import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EmergencyAction } from '../../../shared/models/tracking-model';
import { ConfirmVehicleActionComponent } from './confirm-vehicle-action';

describe('ConfirmVehicleActionComponent', () => {
  let fixture: ComponentFixture<ConfirmVehicleActionComponent>;
  const dialogRefMock = { close: vi.fn() };

  async function create(action: EmergencyAction): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmVehicleActionComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: { vehicleId: 'veh-001', action } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmVehicleActionComponent);
    fixture.detectChanges();
  }

  function findButton(label: string): HTMLButtonElement {
    return (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes(label)) as HTMLButtonElement;
  }

  beforeEach(() => {
    dialogRefMock.close.mockClear();
  });

  it('shows the vehicle id and the action consequences', async () => {
    await create('return_to_depot');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('veh-001');
    expect(el.textContent).toContain('Return to depot');
    expect(el.textContent).toContain('passenger');
  });

  it('lets the user confirm a standard action immediately', async () => {
    await create('maintenance');
    const confirm = findButton('Confirm');
    expect(confirm.disabled).toBe(false);
    confirm.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('closes with false when cancelled', async () => {
    await create('maintenance');
    findButton('Cancel').click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(false);
  });

  it('requires typing the exact vehicle id to confirm an emergency stop', async () => {
    await create('emergency_stop');
    const confirm = findButton('Confirm');
    expect(confirm.disabled).toBe(true);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'veh-00';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(confirm.disabled).toBe(true);

    input.value = 'veh-001';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(confirm.disabled).toBe(false);

    confirm.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });
});