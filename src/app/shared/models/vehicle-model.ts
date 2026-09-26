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
    available: 'var(--color-success)',
    in_service: 'var(--color-accent)',
    maintenance: 'var(--color-warning)',
    charging: 'var(--color-neutral-secondary)',
    out_of_service: 'var(--color-danger)',
};

export const VEHICLE_STATUS_COLORS_BG: Record<VehicleStatus, string> = {
    available: 'var(--color-available-bg)',
    in_service: 'var(--color-in_service-bg)',
    maintenance: 'var(--color-maintenance-bg)',
    charging: 'var(--color-charging-bg)',
    out_of_service: 'var(--color-out_of_service-bg)',
};

export const VEHICLE_STATUS_COLORS_TEXT: Record<VehicleStatus, string> = {
    available: 'var(--color-available-text)',
    in_service: 'var(--color-in_service-text)',
    maintenance: 'var(--color-maintenance-text)',
    charging: 'var(--color-charging-text)',
    out_of_service: 'var(--color-out_of_service-text)',
};

export interface VehiclePage {
    content: Vehicle[];
    totalElements: number;
}

export interface VehicleDetail {
    id: string;
    model: string;
    serialNumber: string;
    status: VehicleStatus;
    batteryPercentage: number;
    estimatedRangeKm: number;
    batteryType: string;
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    totalKm: number;
    firmwareVersion: string;
}

export type RideOutcome = 'completed' | 'cancelled' | 'interrupted';

export interface RideHistoryEntry {
    rideId: string;
    date: string;
    durationMinutes: number;
    outcome: RideOutcome;
}

export const RIDE_OUTCOME_LABELS: Record<RideOutcome, string> = {
    completed: 'Completed',
    cancelled: 'Cancelled',
    interrupted: 'Interrupted',
};

export const RIDE_OUTCOME_COLORS: Record<RideOutcome, string> = {
    completed: 'var(--color-success)',
    cancelled: 'var(--color-warning)',
    interrupted: 'var(--color-danger)',
};

export const RIDE_OUTCOME_COLORS_BG: Record<RideOutcome, string> = {
    completed: 'var(--color-completed-bg)',
    cancelled: 'var(--color-cancelled-bg)',
    interrupted: 'var(--color-interrupted-bg)',
};

export const RIDE_OUTCOME_COLORS_TEXT: Record<RideOutcome, string> = {
    completed: 'var(--color-completed-text)',
    cancelled: 'var(--color-cancelled-text)',
    interrupted: 'var(--color-interrupted-text)',
};

export interface RideHistoryPage {
    content: RideHistoryEntry[];
    totalElements: number;
}

export interface MaintenanceRequest {
    date: string;
    type: string;
    assignedTo?: string;
}

export type FirmwareUpdateStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface FirmwareUpdateResult {
    jobId: string;
    status: FirmwareUpdateStatus;
}

export const FIRMWARE_UPDATE_STATUS_LABELS: Record<FirmwareUpdateStatus, string> = {
    in_progress: 'In progress',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
};

export const LOW_BATTERY_THRESHOLD = 20;

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