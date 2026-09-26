import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/envirornment-local';
import { Customer, CustomerPage } from '../../shared/models/payments-model';

const MOCK_CUSTOMER_PAGE_SIZE = 6;

const MOCK_CUSTOMERS: Customer[] = [
    { id: 'cust-001', name: 'Marta Rossi', totalRides: 42 },
    { id: 'cust-002', name: 'Luca Bianchi', totalRides: 18 },
    { id: 'cust-003', name: 'Giulia Verdi', totalRides: 7 },
    { id: 'cust-004', name: 'Marco Romano', totalRides: 33 },
    { id: 'cust-005', name: 'Elena Conti', totalRides: 2 },
    { id: 'cust-006', name: 'Paolo Greco', totalRides: 51 },
    { id: 'cust-007', name: 'Sofia Marino', totalRides: 11 },
    { id: 'cust-008', name: 'Andrea Villa', totalRides: 4 },
    { id: 'cust-009', name: 'Chiara Costa', totalRides: 29 },
    { id: 'cust-010', name: 'Davide Fontana', totalRides: 1 },
    { id: 'cust-011', name: 'Francesca Ricci', totalRides: 15 },
    { id: 'cust-012', name: 'Simone Galli', totalRides: 8 },
];

@Service()
export class CustomerService {
    private readonly http = inject(HttpClient);
    readonly baseUrl = environment.apiPath + environment.apiUrlCustomers;

    getCustomers(params: { search?: string; page?: number } = {}): Observable<CustomerPage> {
        if (environment.useMock) {
            let list = [...MOCK_CUSTOMERS];
            const search = params.search?.trim().toLowerCase();
            if (search) {
                list = list.filter((c) => c.name.toLowerCase().includes(search));
            }
            const page = params.page ?? 0;
            const start = page * MOCK_CUSTOMER_PAGE_SIZE;
            const result: CustomerPage = {
                content: list.slice(start, start + MOCK_CUSTOMER_PAGE_SIZE),
                totalElements: list.length,
            };
            return of(result).pipe(delay(250));
        }
        let httpParams = new HttpParams();
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
        return this.http.get<CustomerPage>(this.baseUrl, { params: httpParams });
    }
}