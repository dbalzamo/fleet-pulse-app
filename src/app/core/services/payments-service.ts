import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/envirornment-local';
import {
    PaymentStatus,
    PaymentStatusFilter,
    PaymentsSummary,
    Transaction,
    TransactionPage,
} from '../../shared/models/payments-model';

const MOCK_TX_PAGE_SIZE = 8;

const MOCK_CUSTOMER_NAMES: readonly string[] = [
    'Marta Rossi',
    'Luca Bianchi',
    'Giulia Verdi',
    'Marco Romano',
    'Elena Conti',
    'Paolo Greco',
    'Sofia Marino',
    'Andrea Villa',
    'Chiara Costa',
    'Davide Fontana',
    'Francesca Ricci',
    'Simone Galli',
] as const;

const MOCK_SUMMARY: PaymentsSummary = {
    todayRevenue: 1248.55,
    completedRides: 18,
    activeCustomers: 27,
    failedPayments: 4,
};

const MOCK_STATUSES: readonly PaymentStatus[] = ['paid', 'paid', 'paid', 'processing', 'failed'] as const;

function buildMockTransactions(): Transaction[] {
    return Array.from({ length: 24 }, (_, i) => {
        const minutesAgo = 8 + i * 47;
        const amount = 10.5 + ((i * 37) % 60);
        return {
            id: `txn-${String(i).padStart(3, '0')}`,
            customerName: MOCK_CUSTOMER_NAMES[i % MOCK_CUSTOMER_NAMES.length],
            rideId: `ride-${String(100 + i).padStart(3, '0')}`,
            vehicleId: `veh-${String((i % 8) + 1).padStart(3, '0')}`,
            amount,
            currency: 'EUR',
            status: MOCK_STATUSES[i % MOCK_STATUSES.length],
            timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
        };
    });
}

function byDateDescending(a: Transaction, b: Transaction): number {
    return b.timestamp.localeCompare(a.timestamp);
}

function toIsoDay(timestamp: string): string {
    return timestamp.slice(0, 10);
}

@Service()
export class PaymentsService {
    private readonly http = inject(HttpClient);
    readonly baseUrl = environment.apiPath + environment.apiUrlPayments;

    private readonly availableTransactions: Transaction[] = buildMockTransactions();

    getSummary(): Observable<PaymentsSummary> {
        if (environment.useMock) {
            return of({ ...MOCK_SUMMARY }).pipe(delay(250));
        }
        return this.http.get<PaymentsSummary>(`${this.baseUrl}/summary`);
    }

    getTransactions(
        params: { from?: string; to?: string; status?: PaymentStatusFilter; page?: number } = {},
    ): Observable<TransactionPage> {
        if (environment.useMock) {
            let list = [...this.availableTransactions].sort(byDateDescending);
            const from = params.from;
            const to = params.to;
            if (from) {
                list = list.filter((t) => toIsoDay(t.timestamp) >= from);
            }
            if (to) {
                list = list.filter((t) => toIsoDay(t.timestamp) <= to);
            }
            if (params.status && params.status !== 'all') {
                const status = params.status;
                list = list.filter((t) => t.status === status);
            }
            const page = params.page ?? 0;
            const start = page * MOCK_TX_PAGE_SIZE;
            const result: TransactionPage = {
                content: list.slice(start, start + MOCK_TX_PAGE_SIZE),
                totalElements: list.length,
            };
            return of(result).pipe(delay(400));
        }
        let httpParams = new HttpParams();
        if (params.from) httpParams = httpParams.set('from', params.from);
        if (params.to) httpParams = httpParams.set('to', params.to);
        if (params.status && params.status !== 'all') httpParams = httpParams.set('status', params.status);
        if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
        return this.http.get<TransactionPage>(`${this.baseUrl}/transactions`, { params: httpParams });
    }

    retryPayment(id: string): Observable<Transaction> {
        if (environment.useMock) {
            const index = this.availableTransactions.findIndex((t) => t.id === id);
            if (index !== -1) {
                this.availableTransactions[index] = { ...this.availableTransactions[index], status: 'processing' };
                return of(this.availableTransactions[index]).pipe(delay(500));
            }
            const fallback: Transaction = {
                id,
                customerName: 'Unknown',
                rideId: 'ride-unknown',
                vehicleId: 'veh-unknown',
                amount: 0,
                currency: 'EUR',
                status: 'processing',
                timestamp: new Date().toISOString(),
            };
            return of(fallback).pipe(delay(500));
        }
        return this.http.post<Transaction>(`${this.baseUrl}/transactions/${id}/retry`, {});
    }
}