import { Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { PAYMENT_CURRENCY, PaymentsSummary } from '../../../shared/models/payments-model';

@Component({
    selector: 'app-payments-metrics',
    imports: [CurrencyPipe],
    templateUrl: './payments-metrics.html',
    styleUrl: './payments-metrics.scss',
})
export class PaymentsMetricsComponent {
    readonly summary = input<PaymentsSummary | null>(null);
    readonly loading = input(false);

    protected readonly currency = PAYMENT_CURRENCY;
    protected readonly hasFailedPayments = computed(() => (this.summary()?.failedPayments ?? 0) > 0);
}