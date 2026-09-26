export type PaymentStatus = 'paid' | 'processing' | 'failed';

export const PAYMENT_STATUSES: readonly PaymentStatus[] = ['paid', 'processing', 'failed'] as const;

export type PaymentStatusFilter = 'all' | PaymentStatus;

export const PAYMENT_STATUS_FILTERS: readonly PaymentStatusFilter[] = ['all', ...PAYMENT_STATUSES] as const;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusFilter, string> = {
    all: 'All',
    paid: 'Pagato',
    processing: 'In elaborazione',
    failed: 'Fallito',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
    paid: 'var(--color-success)',
    processing: 'var(--color-warning)',
    failed: 'var(--color-danger)',
};

export const PAYMENT_STATUS_COLORS_BG: Record<PaymentStatus, string> = {
    paid: 'var(--color-paid-bg)',
    processing: 'var(--color-processing-bg)',
    failed: 'var(--color-failed-bg)',
};

export const PAYMENT_STATUS_COLORS_TEXT: Record<PaymentStatus, string> = {
    paid: 'var(--color-paid-text)',
    processing: 'var(--color-processing-text)',
    failed: 'var(--color-failed-text)',
};

export const PAYMENT_CURRENCY = 'EUR';

export interface PaymentsSummary {
    todayRevenue: number;
    completedRides: number;
    activeCustomers: number;
    failedPayments: number;
}

export interface Transaction {
    id: string;
    customerName: string;
    rideId: string;
    vehicleId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    timestamp: string;
}

export interface TransactionPage {
    content: Transaction[];
    totalElements: number;
}

export interface Customer {
    id: string;
    name: string;
    totalRides: number;
}

export interface CustomerPage {
    content: Customer[];
    totalElements: number;
}