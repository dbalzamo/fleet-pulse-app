import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveVehicle } from '../../../shared/models/tracking-model';
import { FleetMapComponent } from './fleet-map';

const mocks = vi.hoisted(() => {
  const markerApi = {
    addTo: vi.fn(() => markerApi),
    remove: vi.fn(() => markerApi),
    setLatLng: vi.fn(() => markerApi),
    setIcon: vi.fn(() => markerApi),
    getLatLng: vi.fn(() => ({ lat: 45.47, lng: 9.2 })),
    on: vi.fn((_event: string, _handler: (...args: unknown[]) => void) => markerApi),
  };
  const mapApi = {
    setView: vi.fn(() => mapApi),
    fitBounds: vi.fn(() => mapApi),
    remove: vi.fn(() => mapApi),
  };
  const polylineApi = {
    addTo: vi.fn(() => polylineApi),
    remove: vi.fn(() => polylineApi),
  };
  return {
    markerApi,
    mapApi,
    polylineApi,
    marker: vi.fn(() => markerApi),
    map: vi.fn(() => mapApi),
    tileLayer: vi.fn(() => ({ addTo: vi.fn(() => ({})) })),
    divIcon: vi.fn((_options: { html?: string }) => ({})),
    latLngBounds: vi.fn(() => ({ pad: vi.fn(() => ({})) })),
    polyline: vi.fn(() => polylineApi),
  };
});

vi.mock('leaflet', () => ({
  map: mocks.map,
  marker: mocks.marker,
  tileLayer: mocks.tileLayer,
  divIcon: mocks.divIcon,
  latLngBounds: mocks.latLngBounds,
  polyline: mocks.polyline,
}));

describe('FleetMapComponent', () => {
  let fixture: ComponentFixture<FleetMapComponent>;
  let component: FleetMapComponent;

  const vehicles: ActiveVehicle[] = [
    {
      id: 'veh-001',
      status: 'in_service',
      latitude: 45.47,
      longitude: 9.2,
      etaMinutes: 12,
      remainingDistanceKm: 6.4,
    },
    {
      id: 'veh-002',
      status: 'emergency',
      latitude: 45.46,
      longitude: 9.19,
      etaMinutes: 20,
      remainingDistanceKm: 9.0,
    },
  ];

  beforeEach(async () => {
    mocks.marker.mockClear();
    mocks.divIcon.mockClear();
    mocks.polyline.mockClear();
    mocks.latLngBounds.mockClear();
    mocks.markerApi.on.mockClear();
    mocks.markerApi.setIcon.mockClear();

    await TestBed.configureTestingModule({
      imports: [FleetMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FleetMapComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('vehicles', []);
    fixture.detectChanges();
  });

  it('should create and initialise the map', () => {
    expect(component).toBeTruthy();
    expect(mocks.map).toHaveBeenCalledTimes(1);
  });

  it('creates a marker for every active vehicle', () => {
    fixture.componentRef.setInput('vehicles', vehicles);
    fixture.detectChanges();
    expect(mocks.marker).toHaveBeenCalledTimes(2);
    expect(mocks.latLngBounds).toHaveBeenCalledTimes(1);
  });

  it('emits the vehicle when its marker is clicked', () => {
    const emitted: ActiveVehicle[] = [];
    component.vehicleSelect.subscribe((v) => emitted.push(v));

    fixture.componentRef.setInput('vehicles', [vehicles[0]]);
    fixture.detectChanges();

    const clickHandlers = mocks.markerApi.on.mock.calls.filter(([event]) => event === 'click');
    expect(clickHandlers.length).toBeGreaterThanOrEqual(1);
    const handler = clickHandlers[0][1];
    handler();
    expect(emitted).toEqual([vehicles[0]]);
  });

  it('renders the selected marker style for the chosen vehicle', () => {
    fixture.componentRef.setInput('vehicles', vehicles);
    fixture.componentRef.setInput('selectedVehicleId', 'veh-001');
    fixture.detectChanges();

    const htmls = mocks.divIcon.mock.calls.map((call) => call[0].html ?? '');
    expect(htmls.some((html) => html.includes('vehicle-marker--selected'))).toBe(true);
  });

  it('draws the remaining route of the selected vehicle', () => {
    const withRoute: ActiveVehicle = {
      ...vehicles[0],
      route: [
        { latitude: 45.47, longitude: 9.2 },
        { latitude: 45.474, longitude: 9.21 },
        { latitude: 45.478, longitude: 9.222 },
      ],
    };
    fixture.componentRef.setInput('vehicles', [withRoute]);
    fixture.componentRef.setInput('selectedVehicleId', 'veh-001');
    fixture.detectChanges();

    expect(mocks.polyline).toHaveBeenCalledTimes(1);
  });
});