import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Vehicle } from '../../../shared/models/vehicle-model';
import { VehicleCardComponent } from './vehicle-card';

describe('VehicleCardComponent', () => {
  let fixture: ComponentFixture<VehicleCardComponent>;
  let component: VehicleCardComponent;

  const vehicle: Vehicle = {
    id: 'veh-001',
    model: 'Tesla Model 3',
    vin: '5YJ3E1EAXKF000001',
    status: 'charging',
    batteryPercentage: 64,
    estimatedRangeKm: 341,
    year: 2024,
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('vehicle', vehicle);
  });

  it('renders vehicle data', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.vehicle-card__model')?.textContent).toContain('Tesla Model 3');
    expect(el.querySelector('.vehicle-card__vin')?.textContent).toContain(vehicle.vin);
    expect(el.textContent).toContain('341');
    expect(el.textContent).toContain('64%');
    expect(el.textContent).toContain('Charging');
  });

  it('shows the battery fill at the battery percentage', () => {
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector(
      '.vehicle-card__battery-fill'
    ) as HTMLElement | null;
    expect(fill).toBeTruthy();
    expect(fill!.style.width).toBe('64%');
  });

  it('emits the vehicle when the details button is clicked', () => {
    const spy = vi.fn();
    component.details.subscribe(spy);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const button = buttons.find((b) => b.textContent?.includes('Details'));
    expect(button).toBeTruthy();
    button!.click();

    expect(spy).toHaveBeenCalledWith(vehicle);
  });

  it('emits the vehicle when the remove button is clicked', () => {
    const spy = vi.fn();
    component.remove.subscribe(spy);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const button = buttons.find((b) => b.textContent?.includes('Remove'));
    expect(button).toBeTruthy();
    button!.click();

    expect(spy).toHaveBeenCalledWith(vehicle);
  });

  it('does not emit events while removing', () => {
    const detailsSpy = vi.fn();
    const removeSpy = vi.fn();
    component.details.subscribe(detailsSpy);
    component.remove.subscribe(removeSpy);

    fixture.componentRef.setInput('removing', true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.vehicle-card__overlay')).toBeTruthy();

    const buttons = Array.from(
      el.querySelectorAll('button')
    ) as HTMLButtonElement[];
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn.disabled).toBe(true);
      btn.click();
    }
    expect(detailsSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });
});