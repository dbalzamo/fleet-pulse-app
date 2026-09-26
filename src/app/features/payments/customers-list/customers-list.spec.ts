import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CustomerService } from '../../../core/services/customer-service';
import { Customer, CustomerPage } from '../../../shared/models/payments-model';
import { CustomerListComponent } from './customers-list';

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let component: CustomerListComponent;
  let customerServiceMock: { getCustomers: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const page: CustomerPage = {
    content: [
      { id: 'cust-001', name: 'Marta Rossi', totalRides: 27 },
      { id: 'cust-002', name: 'Luca Bianchi', totalRides: 12 },
    ],
    totalElements: 2,
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    customerServiceMock = { getCustomers: vi.fn().mockReturnValue(of(page)) };
    routerMock = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        { provide: CustomerService, useValue: customerServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createComponent(): Promise<ComponentFixture<CustomerListComponent>> {
    const f = TestBed.createComponent(CustomerListComponent);
    component = f.componentInstance;
    f.detectChanges();
    await vi.advanceTimersByTimeAsync(350);
    f.detectChanges();
    return f;
  }

  it('loads the customers and renders initials avatars', async () => {
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(customerServiceMock.getCustomers).toHaveBeenCalledTimes(1);
    expect(el.querySelectorAll('app-customer-row')).toHaveLength(2);
    expect(el.textContent).toContain('Marta Rossi');
    expect(el.textContent).toContain('27 corse');
    expect(el.textContent).toContain('MR');
  });

  it('debounces the search and issues a single request', async () => {
    fixture = await createComponent();

    component['searchQuery'].set('rossi');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(200);
    expect(customerServiceMock.getCustomers).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);
    fixture.detectChanges();
    expect(customerServiceMock.getCustomers).toHaveBeenCalledTimes(2);
    const lastCall = customerServiceMock.getCustomers.mock.calls.at(-1)?.[0];
    expect(lastCall.search).toBe('rossi');
    expect(lastCall.page).toBe(0);
  });

  it('navigates to the customer details page on row click', async () => {
    fixture = await createComponent();
    const row = fixture.nativeElement.querySelector('.customer-row__main') as HTMLButtonElement;
    row.click();
    fixture.detectChanges();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/customers', 'cust-001']);
  });

  it('appends the next page when loading more', async () => {
    const martaAndLuca = page.content;
    customerServiceMock.getCustomers = vi.fn().mockImplementation(({ page: requestedPage } = {}) =>
      of(
        requestedPage === 1
          ? { content: [{ id: 'cust-003', name: 'Giulia Verdi', totalRides: 5 }], totalElements: 3 }
          : { content: martaAndLuca, totalElements: 3 }
      )
    );
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    const loadMore = (
      Array.from(el.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Carica altri')) as HTMLButtonElement;
    expect(loadMore).toBeTruthy();
    loadMore.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(100);
    fixture.detectChanges();

    expect(el.querySelectorAll('app-customer-row')).toHaveLength(3);
    expect(el.textContent).toContain('Mostrati 3 di 3');
  });

  it('shows the empty search state', async () => {
    customerServiceMock.getCustomers.mockReturnValue(of({ content: [], totalElements: 0 }));
    fixture = await createComponent();
    component['searchQuery'].set('inesistente');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(350);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nessun cliente corrisponde alla ricerca.');
  });
});