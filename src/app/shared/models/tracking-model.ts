export type ActiveVehicleStatus = 'in_service' | 'attention' | 'emergency';

export interface TrackPoint {
    latitude: number;
    longitude: number;
}

export interface ActiveVehicle {
    id: string;
    status: ActiveVehicleStatus;
    latitude: number;
    longitude: number;
    /** Heading in degrees (0–359, clockwise from north). Optional: real feeds may not provide it. */
    heading?: number;
    batteryPercentage: number;
    etaMinutes: number;
    remainingDistanceKm: number;
    /** Recent positions; used to draw the vehicle trail on the map. */
    route?: TrackPoint[];
}

export type EmergencyAction = 'maintenance' | 'send_operator' | 'return_to_depot' | 'emergency_stop';

export interface VehicleActionRequest {
    vehicleId: string;
    action: EmergencyAction;
}

export interface VehicleActionResult {
    vehicleId: string;
    action: EmergencyAction;
    status: 'accepted';
}

export type TrackingConnectionStatus = 'connecting' | 'connected' | 'polling' | 'disconnected';

export const ACTIVE_VEHICLE_STATUS_LABELS: Record<ActiveVehicleStatus, string> = {
    in_service: 'In service',
    attention: 'Attention',
    emergency: 'Emergency',
};

export const ACTIVE_VEHICLE_STATUS_COLORS: Record<ActiveVehicleStatus, string> = {
    in_service: 'var(--color-accent)',
    attention: 'var(--color-warning)',
    emergency: 'var(--color-danger)',
};

export const ACTIVE_VEHICLE_STATUS_COLORS_BG: Record<ActiveVehicleStatus, string> = {
    in_service: 'var(--color-in_service-bg)',
    attention: 'var(--color-attention-bg)',
    emergency: 'var(--color-emergency-bg)',
};

export const ACTIVE_VEHICLE_STATUS_COLORS_TEXT: Record<ActiveVehicleStatus, string> = {
    in_service: 'var(--color-in_service-text)',
    attention: 'var(--color-attention-text)',
    emergency: 'var(--color-emergency-text)',
};

export const ACTION_LABELS: Record<EmergencyAction, string> = {
    maintenance: 'Maintenance',
    send_operator: 'Send operator',
    return_to_depot: 'Return to depot',
    emergency_stop: 'Emergency stop',
};

export const CONNECTION_LABELS: Record<TrackingConnectionStatus, string> = {
    connecting: 'Connecting',
    connected: 'Live',
    polling: 'Polling',
    disconnected: 'Disconnected',
};

export const ACTION_CONSEQUENCES: Record<EmergencyAction, string> = {
    maintenance: 'A maintenance request will be sent for this vehicle.',
    send_operator: 'An operator will be dispatched to physically recover the vehicle.',
    return_to_depot:
        'The current ride will be interrupted and the vehicle will return to the depot. The passenger on board will be notified.',
    emergency_stop:
        'The vehicle will brake to an immediate stop. Occupants will be notified. This command overrides any other instruction.',
};