import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveVehicle } from '../../../shared/models/tracking-model';
import { FleetMapComponent } from './fleet-map';

const mocks = vi.hoisted(() => {
  const popupApi = {
    setContent: vi.fn((_content: string) => popupApi),
  };
  const markerApi = {
    addTo: vi.fn(() => markerApi),
    remove: vi.fn(() => markerApi),
    setLatLng: vi.fn(() => markerApi),
    setIcon: vi.fn(() => markerApi),
    getLatLng: vi.fn(() => ({ lat: 45.47, lng: 9.2 })),
    bindPopup: vi.fn(() => markerApi),
    openPopup: vi.fn(() => markerApi),
    on: vi.fn((_event: string, _handler: (...args: unknown[]) => void) => markerApi),
  };
  const mapApi = {
    setView: vi.fn(() => mapApi),
    fitBounds: vi.fn(() => mapApi),
    panTo: vi.fn(() => mapApi),
    closePopup: vi.fn(() => mapApi),
    remove: vi.fn(() => mapApi),
  };
  const polylineApi = {
    addTo: vi.fn(() => polylineApi),
    remove: vi.fn(() => polylineApi),
  };
  return {
    popupApi,
    markerApi,
    mapApi,
    polylineApi,
    marker: vi.fn(() => markerApi),
    map: vi.fn((_el: unknown, options: Record<string, boolean>) => mapApi),
    tileLayer: vi.fn(() => ({ addTo: vi.fn(() => ({})) })),
    divIcon: vi.fn((_options: { html?: string }) => ({})),
    popup: vi.fn(() => popupApi),
    latLngBounds: vi.fn(() => ({ pad: vi.fn(() => ({})) })),
    polyline: vi.fn(() => polylineApi),
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

describe('FleetMapComponent', () => {
  let fixture: ComponentFixture<FleetMapComponent>;
  let component: FleetMapComponent;

  const vehicles: ActiveVehicle[] = [
    {
      id: 'RT-1001',
      status: 'in_service',
      latitude: 45.47,
      longitude: 9.2,
      heading: 90,
      batteryPercentage: 87,
      etaMinutes: 12,
      remainingDistanceKm: 6.4,
    },
    {
      id: 'RT-1002',
      status: 'emergency',
      latitude: 45.46,
      longitude: 9.19,
      heading: 0,
      batteryPercentage: 14,
      etaMinutes: 20,
      remainingDistanceKm: 9.0,
    },
  ];

  beforeEach(async () => {
    mocks.marker.mockClear();
    mocks.divIcon.mockClear();
    mocks.polyline.mockClear();
    mocks.latLngBounds.mockClear();
    mocks.popup.mockClear();
    mocks.markerApi.on.mockClear();
    mocks.markerApi.setIcon.mockClear();
    mocks.markerApi.bindPopup.mockClear();
    mocks.markerApi.openPopup.mockClear();
    mocks.mapApi.panTo.mockClear();
    mocks.mapApi.closePopup.mockClear();
    mocks.popupApi.setContent.mockClear();

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

  it('renders a car icon rotated by the vehicle heading', () => {
    fixture.componentRef.setInput('vehicles', [vehicles[0]]);
    fixture.detectChanges();

    const htmls = mocks.divIcon.mock.calls.map((call) => call[0].html ?? '');
    expect(htmls.some((html) => html.includes('vehicle-marker__car'))).toBe(true);
    expect(htmls.some((html) => html.includes('--heading: 90deg'))).toBe(true);
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

  it('binds a popup with the vehicle details', () => {
    fixture.componentRef.setInput('vehicles', [vehicles[0]]);
    fixture.detectChanges();

    expect(mocks.markerApi.bindPopup).toHaveBeenCalledTimes(1);
    expect(mocks.popupApi.setContent).toHaveBeenCalledTimes(1);
    const popupHtml = mocks.popupApi.setContent.mock.calls[0][0];
    expect(popupHtml).toContain('RT-1001');
    expect(popupHtml).toContain('In service');
    expect(popupHtml).toContain('87%');
  });

  it('pans to and opens the popup of the selected vehicle', () => {
    fixture.componentRef.setInput('vehicles', vehicles);
    fixture.detectChanges();

    mocks.mapApi.panTo.mockClear();
    mocks.markerApi.openPopup.mockClear();
    fixture.componentRef.setInput('selectedVehicleId', 'RT-1001');
    fixture.detectChanges();

    expect(mocks.mapApi.panTo).toHaveBeenCalledTimes(1);
    expect(mocks.markerApi.openPopup).toHaveBeenCalledTimes(1);
  });

  it('closes the popup when the selection is cleared', () => {
    fixture.componentRef.setInput('vehicles', vehicles);
    fixture.componentRef.setInput('selectedVehicleId', 'RT-1001');
    fixture.detectChanges();

    fixture.componentRef.setInput('selectedVehicleId', null);
    fixture.detectChanges();

    expect(mocks.mapApi.closePopup).toHaveBeenCalledTimes(1);
  });

  it('renders the selected marker style for the chosen vehicle', () => {
    fixture.componentRef.setInput('vehicles', vehicles);
    fixture.componentRef.setInput('selectedVehicleId', 'RT-1001');
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
    fixture.componentRef.setInput('selectedVehicleId', 'RT-1001');
    fixture.detectChanges();

    expect(mocks.polyline).toHaveBeenCalledTimes(1);
  });

  it('creates the map without user interactions in compact mode', () => {
    mocks.map.mockClear();
    const compactFixture = TestBed.createComponent(FleetMapComponent);
    compactFixture.componentRef.setInput('vehicles', []);
    compactFixture.componentRef.setInput('compact', true);
    compactFixture.detectChanges();

    const options = mocks.map.mock.calls[0][1];
    expect(options).toEqual({
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
    });
  });

  it('does not attach click handlers or popups to markers in compact mode', () => {
    mocks.markerApi.on.mockClear();
    mocks.markerApi.bindPopup.mockClear();
    const compactFixture = TestBed.createComponent(FleetMapComponent);
    compactFixture.componentRef.setInput('vehicles', vehicles);
    compactFixture.componentRef.setInput('compact', true);
    compactFixture.detectChanges();

    const clickHandlers = mocks.markerApi.on.mock.calls.filter(([event]) => event === 'click');
    expect(clickHandlers.length).toBe(0);
    expect(mocks.markerApi.bindPopup).not.toHaveBeenCalled();
  });
});