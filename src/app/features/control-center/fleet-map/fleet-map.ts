import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, effect, inject, input, output } from '@angular/core';
import * as L from 'leaflet';
import { ACTIVE_VEHICLE_STATUS_COLORS, ACTIVE_VEHICLE_STATUS_LABELS, ActiveVehicle } from '../../../shared/models/tracking-model';

@Component({
    selector: 'app-fleet-map',
    templateUrl: './fleet-map.html',
    styleUrl: './fleet-map.scss',
})
export class FleetMapComponent implements AfterViewInit {
    readonly vehicles = input.required<ActiveVehicle[]>();
    readonly selectedVehicleId = input<string | null>(null);

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

    constructor() {
        effect(() => {
            const vehicles = this.vehicles();
            const selectedId = this.selectedVehicleId();
            if (!this.mapReady) {
                return;
            }
            this.syncMarkers(vehicles, selectedId);
            this.syncRoute(selectedId);
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
        this.map = L.map(this.mapContainer.nativeElement, { zoomControl: true }).setView([45.4642, 9.19], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);
        this.mapReady = true;
        this.syncMarkers(this.vehicles(), this.selectedVehicleId());
        this.syncRoute(this.selectedVehicleId());
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
            const color = ACTIVE_VEHICLE_STATUS_COLORS[vehicle.status];
            const selected = vehicle.id === selectedId;
            const existing = this.markers.get(vehicle.id);
            if (existing) {
                const position = existing.getLatLng();
                if (position.lat !== vehicle.latitude || position.lng !== vehicle.longitude) {
                    existing.setLatLng([vehicle.latitude, vehicle.longitude]);
                }
                existing.setIcon(this.buildIcon(color, selected));
            } else {
                const marker = L.marker([vehicle.latitude, vehicle.longitude], {
                    icon: this.buildIcon(color, selected),
                    keyboard: false,
                    title: vehicle.id,
                })
                    .addTo(this.map)
                    .on('click', () => this.vehicleSelect.emit(vehicle));
                this.markers.set(vehicle.id, marker);
            }
        }
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

    private buildIcon(color: string, selected: boolean): L.DivIcon {
        const className = selected ? 'vehicle-marker vehicle-marker--selected' : 'vehicle-marker';
        const size = selected ? [20, 20] : [14, 14];
        return L.divIcon({
            className: '',
            html: `<span class="${className}" style="--sc: ${color}"></span>`,
            iconSize: [size[0], size[1]],
            iconAnchor: [size[0] / 2, size[1] / 2],
        });
    }
}