import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FleetTrackingService } from '../../core/services/fleet-tracking-service';
import { ActiveVehicle, TrackingConnectionStatus } from '../../shared/models/tracking-model';
import { ControlCenterComponent } from './control-center';

const mocks = vi.hoisted(() => {
  const popupApi = { setContent: vi.fn(() => popupApi) };
  const markerApi = {
    addTo: vi.fn(() => markerApi),
    remove: vi.fn(() => markerApi),
    setLatLng: vi.fn(() => markerApi),
    setIcon: vi.fn(() => markerApi),
    getLatLng: vi.fn(() => ({ lat: 45.47, lng: 9.2 })),
    bindPopup: vi.fn(() => markerApi),
    openPopup: vi.fn(() => markerApi),
    on: vi.fn(() => markerApi),
  };
  const mapApi = {
    setView: vi.fn(() => mapApi),
    fitBounds: vi.fn(() => mapApi),
    panTo: vi.fn(() => mapApi),
    closePopup: vi.fn(() => mapApi),
    remove: vi.fn(() => mapApi),
  };
  return {
    popupApi,
    markerApi,
    mapApi,
    marker: vi.fn(() => markerApi),
    map: vi.fn(() => mapApi),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    divIcon: vi.fn(() => ({})),
    popup: vi.fn(() => popupApi),
    latLngBounds: vi.fn(() => ({ pad: vi.fn(() => ({})) })),
    polyline: vi.fn(() => ({ addTo: vi.fn(), remove: vi.fn() })),
  };
});

vi.mock('leaflet', () => ({
  map: mocks.map,
  marker: mocks.marker,
  tileLayer: mocks.tileLayer,
  divIcon: mocks.divIcon,
  popup: mocks.popup,
  latLngBounds: mocks.latLngBounds,
  polyline: mocks.polyline,
}));

describe('ControlCenterComponent', () => {
  let fixture: ComponentFixture<ControlCenterComponent>;
  let component: ControlCenterComponent;
  let trackingMock: {
    positions: WritableSignal<ActiveVehicle[]>;
    status: WritableSignal<TrackingConnectionStatus>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };

  const vehicles: ActiveVehicle[] = [
    {
      id: 'veh-001',
      status: 'in_service',
      latitude: 45.47,
      longitude: 9.2,
      heading: 90,
      batteryPercentage: 87,
      etaMinutes: 12,
      remainingDistanceKm: 6.4,
    },
    {
      id: 'veh-002',
      status: 'emergency',
      latitude: 45.46,
      longitude: 9.19,
      heading: 180,
      batteryPercentage: 14,
      etaMinutes: 20,
      remainingDistanceKm: 9.0,
    },
  ];

  beforeEach(async () => {
    trackingMock = {
      positions: signal(vehicles),
      status: signal<TrackingConnectionStatus>('connected'),
      start: vi.fn(),
      stop: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ControlCenterComponent],
      providers: [{ provide: FleetTrackingService, useValue: trackingMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function findCell(label: string): HTMLButtonElement {
    return (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes(label)) as HTMLButtonElement;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the headline, the live status and one cell per vehicle', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Control Center');
    expect(el.textContent).toContain('Live');
    expect(el.textContent).toContain('veh-001');
    expect(el.textContent).toContain('veh-002');
    expect(el.querySelectorAll('app-active-vehicle-cell').length).toBe(2);
  });

  it('shows the actions panel in its disabled state while nothing is selected', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Select a vehicle');
    expect(component['selectedVehicleId']()).toBeNull();
  });

  it('selects a vehicle from the list and highlights its card', () => {
    findCell('veh-001').click();
    fixture.detectChanges();

    expect(component['selectedVehicleId']()).toBe('veh-001');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Commands for veh-001');

    const selectedCells = Array.from(fixture.nativeElement.querySelectorAll('.vehicle-cell--selected')) as HTMLElement[];
    expect(selectedCells.length).toBe(1);
    expect(selectedCells[0].textContent).toContain('veh-001');
  });

  it('clears the selection if the vehicle disappears from the live feed', () => {
    findCell('veh-001').click();
    fixture.detectChanges();
    expect(component['selectedVehicleId']()).toBe('veh-001');

    trackingMock.positions.set([vehicles[1]]);
    fixture.detectChanges();
    expect(component['selectedVehicleId']()).toBeNull();
  });

  it('shows the empty state when the fleet feed has no vehicles', () => {
    trackingMock.positions.set([]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No vehicles are currently on the road.');
    expect(fixture.nativeElement.querySelector('app-fleet-map')).toBeNull();
  });
});