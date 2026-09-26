export interface DashboardSummary {
    totalVehicles: number;
    inServiceVehicles: number;
    todayRevenue: number;
    activeAlerts: number;
}

export type NotificationType = 'battery_low' | 'maintenance_completed' | 'new_customer' | 'emergency';

export interface RecentNotification {
    id: string;
    type: NotificationType;
    message: string;
    timestamp: string;
}

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
    battery_low: 'Battery low',
    maintenance_completed: 'Maintenance completed',
    new_customer: 'New customer',
    emergency: 'Emergency',
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
    battery_low: 'var(--color-warning)',
    maintenance_completed: 'var(--color-success)',
    new_customer: 'var(--color-success)',
    emergency: 'var(--color-danger)',
};