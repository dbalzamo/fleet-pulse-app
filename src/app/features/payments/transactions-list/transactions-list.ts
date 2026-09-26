import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable, catchError, combineLatest, debounceTime, finalize, of, switchMap, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification-service';
import { PaymentsService } from '../../../core/services/payments-service';
import {
    PAYMENT_STATUS_FILTERS,
    PAYMENT_STATUS_LABELS,
    PaymentStatusFilter,
    Transaction,
    TransactionPage,
} from '../../../shared/models/payments-model';
import {
    RetryPaymentConfirmComponent,
    RetryPaymentConfirmData,
} from '../dialogs/retry-payment-confirm/retry-payment-confirm';
import { TransactionRowComponent } from './transaction-row';

@Component({
    selector: 'app-transactions-list',
    imports: [
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        TransactionRowComponent,
    ],
    templateUrl: './transactions-list.html',
    styleUrl: './transactions-list.scss',
})
export class TransactionsListComponent {
    private readonly paymentsService = inject(PaymentsService);
    private readonly notificationService = inject(NotificationService);
    private readonly dialog = inject(MatDialog);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly statuses = PAYMENT_STATUS_FILTERS;
    protected readonly statusLabels = PAYMENT_STATUS_LABELS;

    protected readonly fromDate = signal('');
    protected readonly toDate = signal('');
    protected readonly statusFilter = signal<PaymentStatusFilter>('all');

    protected readonly transactions = signal<Transaction[]>([]);
    protected readonly totalTransactions = signal(0);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);

    protected readonly isLoadingMore = signal(false);
    private page = -1;
    protected readonly exhausted = signal(false);

    protected readonly retryingIds = signal<string[]>([]);

    protected readonly isFiltersActive = computed(
        () => this.fromDate() !== '' || this.toDate() !== '' || this.statusFilter() !== 'all'
    );

    constructor() {
        combineLatest([
            toObservable(this.fromDate),
            toObservable(this.toDate),
            toObservable(this.statusFilter),
        ])
            .pipe(
                debounceTime(300),
                switchMap(([from, to, status]) => this.fetchPage(from, to, status, 0)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe();
    }

    protected reload(): void {
        this.fetchPage(this.fromDate(), this.toDate(), this.statusFilter(), 0)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    protected resetFilters(): void {
        this.fromDate.set('');
        this.toDate.set('');
        this.statusFilter.set('all');
    }

    protected loadMore(): void {
        if (this.loading() || this.isLoadingMore() || this.exhausted()) {
            return;
        }
        this.isLoadingMore.set(true);
        this.fetchPage(this.fromDate(), this.toDate(), this.statusFilter(), this.page + 1)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.isLoadingMore.set(false))
            )
            .subscribe();
    }

    protected isRetrying(id: string): boolean {
        return this.retryingIds().includes(id);
    }

    protected retry(transaction: Transaction): void {
        const data: RetryPaymentConfirmData = {
            title: 'Riprova addebito',
            message: `Riprova l'addebito per ${transaction.customerName} (${transaction.rideId})?`,
        };
        const dialogRef = this.dialog.open<RetryPaymentConfirmComponent, RetryPaymentConfirmData, boolean>(
            RetryPaymentConfirmComponent,
            { width: '440px', autoFocus: false, data }
        );
        dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed) => {
                if (!confirmed) {
                    return;
                }
                this.retryingIds.update((ids) => [...ids, transaction.id]);
                this.paymentsService
                    .retryPayment(transaction.id)
                    .pipe(
                        takeUntilDestroyed(this.destroyRef),
                        finalize(() =>
                            this.retryingIds.update((ids) => ids.filter((id) => id !== transaction.id))
                        )
                    )
                    .subscribe({
                        next: (updated) => {
                            this.transactions.update((list) =>
                                list.map((t) => (t.id === updated.id ? { ...t, status: updated.status } : t))
                            );
                            this.notificationService.success('Addebito ritentato con successo.');
                        },
                        error: () => {
                            this.notificationService.error(
                                "Impossibile ritentare l'addebito. Riprova più tardi."
                            );
                        },
                    });
            });
    }

    private fetchPage(
        from: string,
        to: string,
        status: PaymentStatusFilter,
        pageNumber: number
    ): Observable<TransactionPage | null> {
        this.loading.set(true);
        this.error.set(null);
        if (pageNumber === 0) {
            this.page = -1;
            this.exhausted.set(false);
        }
        return this.paymentsService
            .getTransactions({
                from: from || undefined,
                to: to || undefined,
                status,
                page: pageNumber,
            })
            .pipe(
                tap((result) => {
                    this.page = pageNumber;
                    this.totalTransactions.set(result.totalElements);
                    this.transactions.update((list) =>
                        pageNumber === 0 ? result.content : list.concat(result.content)
                    );
                    if (this.transactions().length >= result.totalElements) {
                        this.exhausted.set(true);
                    }
                }),
                catchError(() => {
                    this.error.set('Impossibile caricare le transazioni. Riprova.');
                    return of(null);
                }),
                finalize(() => this.loading.set(false))
            );
    }
}