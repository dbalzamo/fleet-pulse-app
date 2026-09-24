import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FleetDetails } from './fleet-details';

describe('FleetDetails', () => {
  let fixture: ComponentFixture<FleetDetails>;
  let component: FleetDetails;
  const routerMock = { navigate: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FleetDetails],
      providers: [{ provide: Router, useValue: routerMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(FleetDetails);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('vehicleId', 'veh-001');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the vehicle id', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('veh-001');
  });

  it('navigates back to the fleet route', () => {
    const button = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Back'));
    expect(button).toBeTruthy();
    button!.click();
    expect(routerMock.navigate).toHaveBeenCalledWith(['fleet']);
  });
});