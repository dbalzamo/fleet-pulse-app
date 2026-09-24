export type VehicleStatus = 'available' | 'in_service' | 'maintenance' | 'charging' | 'out_of_service';

export interface Vehicle {
    id: string;
    model: string;
    status: VehicleStatus;
    batteryPercentage: number;
    estimatedRangeKm: number;
    vin: string;
    year?: number;
    color?: string;
}

export type AddVehicleRequest = Omit<Vehicle, 'id'>;

export type VehicleStatusFilter = 'all' | VehicleStatus;

export const VEHICLE_STATUSES: readonly VehicleStatus[] = [
    'available',
    'in_service',
    'maintenance',
    'charging',
    'out_of_service',
] as const;

export const VEHICLE_STATUS_FILTERS: readonly VehicleStatusFilter[] = ['all', ...VEHICLE_STATUSES] as const;

export const VEHICLE_STATUS_LABELS: Record<VehicleStatusFilter, string> = {
    all: 'All status',
    available: 'Available',
    in_service: 'In Service',
    maintenance: 'Maintenance',
    charging: 'Charging',
    out_of_service: 'Out of Service',
};

export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
    available: 'var(--status-available)',
    in_service: 'var(--status-in_service)',
    maintenance: 'var(--status-maintenance)',
    charging: 'var(--status-charging)',
    out_of_service: 'var(--status-out_of_service)',
};

export interface VehiclePage {
    content: Vehicle[];
    totalElements: number;
}

export interface FleetMetrics {
    total: number;
    available: number;
    inService: number;
    maintenance: number;
    charging: number;
    outOfService: number;
    averageBattery: number;
    averageRangeKm: number;
}