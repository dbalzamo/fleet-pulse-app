import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Observable, catchError, debounceTime, finalize, of, switchMap, tap } from 'rxjs';
import { CustomerService } from '../../../core/services/customer-service';
import { Customer, CustomerPage } from '../../../shared/models/payments-model';
import { CustomerRowComponent } from './customer-row';

const AVATAR_COLORS: readonly string[] = [
    'var(--color-accent)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-neutral-secondary)',
    'var(--color-danger)',
];

@Component({
    selector: 'app-customer-list',
    imports: [
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        CustomerRowComponent,
    ],
    templateUrl: './customers-list.html',
    styleUrl: './customers-list.scss',
})
export class CustomerListComponent {
    private readonly customerService = inject(CustomerService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly searchQuery = signal('');

    protected readonly customers = signal<Customer[]>([]);
    protected readonly totalCustomers = signal(0);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);

    protected readonly isLoadingMore = signal(false);
    private page = -1;
    protected readonly exhausted = signal(false);

    constructor() {
        toObservable(this.searchQuery)
            .pipe(
                debounceTime(300),
                switchMap((search) => this.fetchPage(search, 0)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe();
    }

    protected reload(): void {
        this.fetchPage(this.searchQuery(), 0).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }

    protected loadMore(): void {
        if (this.loading() || this.isLoadingMore() || this.exhausted()) {
            return;
        }
        this.isLoadingMore.set(true);
        this.fetchPage(this.searchQuery(), this.page + 1)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.isLoadingMore.set(false))
            )
            .subscribe();
    }

    protected openCustomer(customer: Customer): void {
        void this.router.navigate(['/customers', customer.id]);
    }

    protected avatarColor(name: string): string {
        let hash = 0;
        for (let i = 0; i < name.length; i += 1) {
            hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
        }
        return AVATAR_COLORS[hash];
    }

    private fetchPage(search: string, pageNumber: number): Observable<CustomerPage | null> {
        this.loading.set(true);
        this.error.set(null);
        if (pageNumber === 0) {
            this.page = -1;
            this.exhausted.set(false);
        }
        return this.customerService
            .getCustomers({ search: search.trim(), page: pageNumber })
            .pipe(
                tap((result) => {
                    this.page = pageNumber;
                    this.totalCustomers.set(result.totalElements);
                    this.customers.update((list) =>
                        pageNumber === 0 ? result.content : list.concat(result.content)
                    );
                    if (this.customers().length >= result.totalElements) {
                        this.exhausted.set(true);
                    }
                }),
                catchError(() => {
                    this.error.set('Impossibile caricare i clienti. Riprova.');
                    return of(null);
                }),
                finalize(() => this.loading.set(false))
            );
    }
}