import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { catchError, finalize, of } from 'rxjs';
import { PaymentsService } from '../../../core/services/payments-service';
import { PaymentsSummary } from '../../../shared/models/payments-model';
import { CustomerListComponent } from '../customers-list/customers-list';
import { PaymentsMetricsComponent } from '../payments-metrics/payments-metrics';
import { TransactionsListComponent } from '../transactions-list/transactions-list';

@Component({
    selector: 'app-payments-dashboard',
    imports: [MatButtonModule, PaymentsMetricsComponent, TransactionsListComponent, CustomerListComponent],
    templateUrl: './payments-dashboard.html',
    styleUrl: './payments-dashboard.scss',
})
export class PaymentsDashboardComponent implements OnInit {
    private readonly paymentsService = inject(PaymentsService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly summary = signal<PaymentsSummary | null>(null);
    protected readonly metricsLoading = signal(true);
    protected readonly metricsError = signal(false);

    ngOnInit(): void {
        this.loadSummary();
    }

    protected reloadSummary(): void {
        this.loadSummary();
    }

    private loadSummary(): void {
        this.metricsLoading.set(true);
        this.metricsError.set(false);
        this.paymentsService
            .getSummary()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                catchError(() => {
                    this.metricsError.set(true);
                    return of(null);
                }),
                finalize(() => this.metricsLoading.set(false))
            )
            .subscribe((summary) => {
                if (summary) {
                    this.summary.set(summary);
                }
            });
    }
}