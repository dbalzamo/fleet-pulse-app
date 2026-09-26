import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DashboardHomeComponent } from './dashboard-home';
import { DashboardService } from '../../../core/services/dashboard-service';
import { FleetTrackingService } from '../../../core/services/fleet-tracking-service';
import { DashboardSummary, RecentNotification } from '../../../shared/models/dashboard-model';
import { ActiveVehicle } from '../../../shared/models/tracking-model';

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
    on: vi.fn((_event: string, _handler: (...args: unknown[]) => void) => markerApi),
  };
  const mapApi = {
    setView: vi.fn(() => mapApi),
    fitBounds: vi.fn(() => mapApi),
    panTo: vi.fn(() => mapApi),
    closePopup: vi.fn(() => mapApi),
    remove: vi.fn(() => mapApi),
  };
  return {
    markerApi,
    mapApi,
    marker: vi.fn(() => markerApi),
    map: vi.fn((_el: unknown, options: unknown) => mapApi),
    tileLayer: vi.fn(() => ({ addTo: vi.fn(() => ({})) })),
    divIcon: vi.fn((_options: { html?: string }) => ({})),
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

describe('DashboardHomeComponent', () => {
  let fixture: ComponentFixture<DashboardHomeComponent>;
  let component: DashboardHomeComponent;
  let trackingMock: { positions: WritableSignal<ActiveVehicle[]>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };

  const summary: DashboardSummary = {
    totalVehicles: 8,
    inServiceVehicles: 3,
    todayRevenue: 1284,
    activeAlerts: 2,
  };

  const notifications: RecentNotification[] = [
    {
      id: 'n1',
      type: 'emergency',
      message: 'Vehicle veh-010 reported an emergency stop.',
      timestamp: new Date(Date.now() - 30 * 60_000).toISOString(),
    },
    {
      id: 'n2',
      type: 'maintenance_completed',
      message: 'Scheduled maintenance completed for veh-004.',
      timestamp: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    },
  ];

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
    trackingMock = { positions: signal(vehicles), start: vi.fn(), stop: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DashboardHomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: {
            getSummary: () => of(summary),
            getRecentNotifications: () => of(notifications),
          },
        },
        { provide: FleetTrackingService, useValue: trackingMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the four summary metrics', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.home__metric-card').length).toBe(4);
    expect(el.textContent).toContain('Mezzi totali');
    expect(el.textContent).toContain('8');
    expect(el.textContent).toContain('3');
    expect(el.textContent).toContain('€1,284');
    expect(el.textContent).toContain('2');
  });

  it('marks the alerts card as dangerous when there are active alerts', () => {
    expect(fixture.nativeElement.querySelector('.home__metric-card--danger')).not.toBeNull();
  });

  it('renders the recent notifications with label and message', () => {
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.home__notification');
    expect(items.length).toBe(2);
    expect(el.textContent).toContain('Emergency');
    expect(el.textContent).toContain('Vehicle veh-010 reported an emergency stop.');
    expect(el.textContent).toContain('Maintenance completed');
  });

  it('reuses the fleet map in a compact, non-interactive layout', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-fleet-map')).not.toBeNull();
    expect(el.querySelector('.map-shell--compact')).not.toBeNull();
    expect(mocks.markerApi.on.mock.calls.filter(([event]) => event === 'click').length).toBe(0);
  });

  it('links the map preview to the control center', () => {
    const link = fixture.nativeElement.querySelector('a.home__panel-link') as HTMLAnchorElement;
    expect(link.textContent).toContain('Vedi tutto');
    expect(link.getAttribute('href')).toContain('/control-center');
  });
});