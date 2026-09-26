import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, effect, inject, input, output } from '@angular/core';
import * as L from 'leaflet';
import { ACTIVE_VEHICLE_STATUS_COLORS, ACTIVE_VEHICLE_STATUS_LABELS, ActiveVehicle } from '../../../shared/models/tracking-model';

const ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

@Component({
    selector: 'app-fleet-map',
    templateUrl: './fleet-map.html',
    styleUrl: './fleet-map.scss',
})
export class FleetMapComponent implements AfterViewInit {
    readonly vehicles = input.required<ActiveVehicle[]>();
    readonly selectedVehicleId = input<string | null>(null);
    readonly compact = input(false);

    readonly vehicleSelect = output<ActiveVehicle>();

    @ViewChild('mapContainer', { static: true }) private readonly mapContainer!: ElementRef<HTMLDivElement>;

    private readonly destroyRef = inject(DestroyRef);

    protected readonly legendItems = [
        { label: ACTIVE_VEHICLE_STATUS_LABELS.in_service, color: ACTIVE_VEHICLE_STATUS_COLORS.in_service },
        { label: ACTIVE_VEHICLE_STATUS_LABELS.attention, color: ACTIVE_VEHICLE_STATUS_COLORS.attention },
        { label: ACTIVE_VEHICLE_STATUS_LABELS.emergency, color: ACTIVE_VEHICLE_STATUS_COLORS.emergency },
    ];

    private map?: L.Map;
    private readonly markers = new Map<string, L.Marker>();
    private routeLayer?: L.Polyline;
    private mapReady = false;
    private fitted = false;
    private lastSelectedId: string | null = null;

    constructor() {
        effect(() => {
            const vehicles = this.vehicles();
            const selectedId = this.selectedVehicleId();
            if (!this.mapReady) {
                return;
            }
            this.syncMarkers(vehicles, selectedId);
            this.syncRoute(selectedId);
            this.syncSelection(selectedId);
            if (!this.fitted && vehicles.length > 0) {
                this.fitted = true;
                this.fitToVehicles(vehicles);
            }
        });
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    private initMap(): void {
        this.map = L.map(this.mapContainer.nativeElement, {
            zoomControl: !this.compact(),
            dragging: !this.compact(),
            scrollWheelZoom: !this.compact(),
        }).setView([45.4642, 9.19], 13);
        // No "{r}" retina placeholder on purpose: the public OSM tile servers
        // now reject every "@2x" (even zoom 13) with HTTP 400, so Leaflet must
        // not substitute it on retina screens.
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);
        this.mapReady = true;
        this.syncMarkers(this.vehicles(), this.selectedVehicleId());
        this.syncRoute(this.selectedVehicleId());
        this.syncSelection(this.selectedVehicleId());
        this.destroyRef.onDestroy(() => {
            this.map?.remove();
            this.map = undefined;
            this.mapReady = false;
            this.markers.clear();
        });
    }

    private fitToVehicles(vehicles: ActiveVehicle[]): void {
        if (!this.map || vehicles.length === 0) {
            return;
        }
        const bounds = L.latLngBounds(vehicles.map((v) => [v.latitude, v.longitude]));
        this.map.fitBounds(bounds.pad(0.3));
    }

    private syncMarkers(vehicles: ActiveVehicle[], selectedId: string | null): void {
        if (!this.map) {
            return;
        }
        const activeIds = new Set(vehicles.map((v) => v.id));
        for (const [id, marker] of this.markers) {
            if (!activeIds.has(id)) {
                marker.remove();
                this.markers.delete(id);
            }
        }
        for (const vehicle of vehicles) {
            const selected = vehicle.id === selectedId;
            const existing = this.markers.get(vehicle.id);
            if (existing) {
                const position = existing.getLatLng();
                if (position.lat !== vehicle.latitude || position.lng !== vehicle.longitude) {
                    existing.setLatLng([vehicle.latitude, vehicle.longitude]);
                }
                existing.setIcon(this.buildIcon(vehicle, selected));
            } else {
                const marker = L.marker([vehicle.latitude, vehicle.longitude], {
                    icon: this.buildIcon(vehicle, selected),
                    keyboard: !this.compact(),
                    title: vehicle.id,
                }).addTo(this.map);
                if (!this.compact()) {
                    marker.bindPopup(L.popup({ closeButton: true, maxWidth: 260 }).setContent(this.buildPopupContent(vehicle)));
                    marker.on('click', () => this.vehicleSelect.emit(vehicle));
                }
                this.markers.set(vehicle.id, marker);
            }
        }
    }

    private syncSelection(selectedId: string | null): void {
        if (!this.map || this.compact() || this.lastSelectedId === selectedId) {
            return;
        }
        this.lastSelectedId = selectedId;
        if (selectedId === null) {
            if (this.map) {
                this.map.closePopup();
            }
            return;
        }
        const marker = this.markers.get(selectedId);
        if (!marker) {
            return;
        }
        marker.openPopup();
        this.map.panTo(marker.getLatLng(), { animate: true });
    }

    private syncRoute(selectedId: string | null): void {
        if (!this.map) {
            return;
        }
        if (this.routeLayer) {
            this.routeLayer.remove();
            this.routeLayer = undefined;
        }
        if (!selectedId) {
            return;
        }
        const selected = this.vehicles().find((v) => v.id === selectedId);
        if (!selected?.route || selected.route.length < 2) {
            return;
        }
        const points = selected.route.map((p) => [p.latitude, p.longitude] as [number, number]);
        this.routeLayer = L.polyline(points, {
            color: ACTIVE_VEHICLE_STATUS_COLORS[selected.status],
            weight: 3,
            opacity: 0.85,
            dashArray: '6 8',
        }).addTo(this.map);
    }

    private buildIcon(vehicle: ActiveVehicle, selected: boolean): L.DivIcon {
        const color = ACTIVE_VEHICLE_STATUS_COLORS[vehicle.status];
        const heading = this.normalizeHeading(vehicle.heading ?? 0);
        const size = selected ? 32 : 26;
        const className = selected ? 'vehicle-marker vehicle-marker--selected' : 'vehicle-marker';
        return L.divIcon({
            className: '',
            html: `<span class="${className}" style="--sc: ${color}; --heading: ${heading}deg">
                <svg class="vehicle-marker__car" viewBox="0 0 24 24" aria-hidden="true">
                    <path class="vehicle-marker__body" d="M5.2 7.1 A2.9 2.9 0 0 1 8.1 4.2 H15.9 A2.9 2.9 0 0 1 18.8 7.1 V14 A2.9 2.9 0 0 1 15.9 16.9 H8.1 A2.9 2.9 0 0 1 5.2 14 Z"/>
                    <path class="vehicle-marker__glass" d="M8.3 5.7 H15.7 A1.4 1.4 0 0 1 17.1 7.1 v0.7 H6.9 V7.1 A1.4 1.4 0 0 1 8.3 5.7 Z"/>
                    <path class="vehicle-marker__glass" d="M6.9 15.2 H17.1 v0.7 A1.4 1.4 0 0 1 15.7 17.3 H8.3 A1.4 1.4 0 0 1 6.9 15.9 Z"/>
                </svg>
            </span>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
        });
    }

    private buildPopupContent(vehicle: ActiveVehicle): string {
        const color = ACTIVE_VEHICLE_STATUS_COLORS[vehicle.status];
        const statusLabel = ACTIVE_VEHICLE_STATUS_LABELS[vehicle.status];
        const tripStats =
            vehicle.status === 'in_service'
                ? `<div><dt>ETA</dt><dd>${vehicle.etaMinutes} min</dd></div>
                   <div><dt>Left</dt><dd>${vehicle.remainingDistanceKm} km</dd></div>`
                : '';
        return `
            <div class="vehicle-popup">
                <div class="vehicle-popup__head">
                    <span class="vehicle-popup__id">${this.escapeHtml(vehicle.id)}</span>
                    <span class="vehicle-popup__status" style="--sc: ${color}">${statusLabel}</span>
                </div>
                <dl class="vehicle-popup__stats">
                    <div><dt>Battery</dt><dd>${vehicle.batteryPercentage ?? '—'}%</dd></div>
                    ${tripStats}
                </dl>
            </div>`;
    }

    private normalizeHeading(deg: number): number {
        return ((Math.round(deg) % 360) + 360) % 360;
    }

    private escapeHtml(value: string): string {
        return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
    }
}