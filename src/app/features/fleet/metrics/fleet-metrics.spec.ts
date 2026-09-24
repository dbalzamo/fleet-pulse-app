import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FleetMetrics } from '../../../shared/models/vehicle-model';
import { FleetMetricsComponent } from './fleet-metrics';

describe('FleetMetricsComponent', () => {
  let fixture: ComponentFixture<FleetMetricsComponent>;
  let component: FleetMetricsComponent;

  const metrics: FleetMetrics = {
    total: 8,
    available: 3,
    inService: 2,
    maintenance: 1,
    charging: 1,
    outOfService: 1,
    averageBattery: 60,
    averageRangeKm: 320,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FleetMetricsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FleetMetricsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('metrics', metrics);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders every metric value', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Total');
    expect(el.textContent).toContain('8');
    expect(el.textContent).toContain('Available');
    expect(el.textContent).toContain('3');
    expect(el.textContent).toContain('In Service');
    expect(el.textContent).toContain('2');
    expect(el.textContent).toContain('Maintenance');
    expect(el.textContent).toContain('1');
    expect(el.textContent).toContain('Charging');
    expect(el.textContent).toContain('60%');
    expect(el.textContent).toContain('320');
  });

  it('applies the loading class when the loading flag is set', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.fleet-metrics')?.classList.contains('fleet-metrics--loading')).toBe(true);
  });
});