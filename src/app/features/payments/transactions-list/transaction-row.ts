import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import {
    PAYMENT_STATUS_COLORS,
    PAYMENT_STATUS_COLORS_BG,
    PAYMENT_STATUS_COLORS_TEXT,
    PAYMENT_STATUS_LABELS,
    Transaction,
} from '../../../shared/models/payments-model';

@Component({
    selector: 'app-transaction-row',
    imports: [CurrencyPipe, DatePipe, MatButtonModule, MatProgressSpinnerModule, RouterLink],
    templateUrl: './transaction-row.html',
    styleUrl: './transaction-row.scss',
})
export class TransactionRowComponent {
    readonly transaction = input.required<Transaction>();
    readonly retrying = input(false);
    readonly retry = output<Transaction>();

    protected readonly statusLabels = PAYMENT_STATUS_LABELS;
    protected readonly statusColors = PAYMENT_STATUS_COLORS;
    protected readonly statusColorsBg = PAYMENT_STATUS_COLORS_BG;
    protected readonly statusColorsText = PAYMENT_STATUS_COLORS_TEXT;

    protected onRetry(): void {
        if (this.retrying()) {
            return;
        }
        this.retry.emit(this.transaction());
    }
}