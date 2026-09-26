import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Customer } from '../../../shared/models/payments-model';

@Component({
    selector: 'app-customer-row',
    imports: [MatIconModule],
    templateUrl: './customer-row.html',
    styleUrl: './customer-row.scss',
})
export class CustomerRowComponent {
    readonly customer = input.required<Customer>();
    readonly accent = input<string>('var(--mat-sys-primary)');
    readonly open = output<Customer>();

    protected initials(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    }
}