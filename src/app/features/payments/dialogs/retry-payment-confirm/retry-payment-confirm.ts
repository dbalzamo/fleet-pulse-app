import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface RetryPaymentConfirmData {
    title: string;
    message: string;
}

@Component({
    selector: 'app-retry-payment-confirm',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './retry-payment-confirm.html',
    styleUrl: './retry-payment-confirm.scss',
})
export class RetryPaymentConfirmComponent {
    private readonly dialogRef = inject(MatDialogRef<RetryPaymentConfirmComponent>);
    readonly data = inject<RetryPaymentConfirmData>(MAT_DIALOG_DATA);

    confirm(): void {
        this.dialogRef.close(true);
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}