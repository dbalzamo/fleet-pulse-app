import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CustomerService } from '../../../core/services/customer-service';
import { NotificationService } from '../../../core/services/notification-service';
import { PaymentsService } from '../../../core/services/payments-service';
import { PaymentsSummary } from '../../../shared/models/payments-model';
import { PaymentsDashboardComponent } from './payments-dashboard';

describe('PaymentsDashboardComponent', () => {
  let fixture: ComponentFixture<PaymentsDashboardComponent>;
  let component: PaymentsDashboardComponent;
  let paymentsMock: {
    getSummary: ReturnType<typeof vi.fn>;
    getTransactions: ReturnType<typeof vi.fn>;
    retryPayment: ReturnType<typeof vi.fn>;
  };
  let customerServiceMock: { getCustomers: ReturnType<typeof vi.fn> };

  const summary: PaymentsSummary = {
    todayRevenue: 1248.55,
    completedRides: 18,
    activeCustomers: 27,
    failedPayments: 4,
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    paymentsMock = {
      getSummary: vi.fn().mockReturnValue(of(summary)),
      getTransactions: vi.fn().mockReturnValue(
        of({
          content: [
            { id: 'txn-1', customerName: 'Marta Rossi', rideId: 'ride-101', vehicleId: 'veh-001', amount: 12.5, currency: 'EUR', status: 'failed', timestamp: '2026-09-24T10:00:00.000Z' },
            { id: 'txn-2', customerName: 'Luca Bianchi', rideId: 'ride-102', vehicleId: 'veh-002', amount: 25, currency: 'EUR', status: 'paid', timestamp: '2026-09-24T09:00:00.000Z' },
          ],
          totalElements: 2,
        })
      ),
      retryPayment: vi.fn().mockReturnValue(of({})),
    };
    customerServiceMock = {
      getCustomers: vi.fn().mockReturnValue(
        of({
          content: [
            { id: 'cust-001', name: 'Marta Rossi', totalRides: 27 },
            { id: 'cust-002', name: 'Luca Bianchi', totalRides: 12 },
          ],
          totalElements: 2,
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [PaymentsDashboardComponent],
      providers: [
        { provide: PaymentsService, useValue: paymentsMock },
        { provide: CustomerService, useValue: customerServiceMock },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createComponent(): Promise<ComponentFixture<PaymentsDashboardComponent>> {
    const f = TestBed.createComponent(PaymentsDashboardComponent);
    component = f.componentInstance;
    f.detectChanges();
    await vi.advanceTimersByTimeAsync(650);
    f.detectChanges();
    return f;
  }

  it('loads the summary and renders the four metric cards', async () => {
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(paymentsMock.getSummary).toHaveBeenCalledTimes(1);
    expect(el.querySelectorAll('app-payments-metrics .metric')).toHaveLength(4);
    expect(el.textContent).toContain('Incasso oggi');
    expect(el.textContent).toContain('1,248.55');
    expect(el.textContent).toContain('Pagamenti falliti');
    expect(el.querySelector('.metric--danger')).not.toBeNull();
  });

  it('renders the transactions and customers columns with separate loading', async () => {
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('app-transaction-row')).toHaveLength(2);
    expect(el.querySelectorAll('app-customer-row')).toHaveLength(2);
    expect(el.textContent).toContain('Transazioni recenti');
    expect(el.textContent).toContain('Clienti');
    expect(component['metricsLoading']()).toBe(false);
  });

  it('shows a retry over the metrics when the summary request fails', async () => {
    paymentsMock.getSummary.mockReturnValue(throwError(() => new Error('boom')));
    fixture = await createComponent();

    expect(component['metricsError']()).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Impossibile caricare le metriche');

    const retry = (
      Array.from(el.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Riprova')) as HTMLButtonElement;
    retry.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    expect(paymentsMock.getSummary).toHaveBeenCalledTimes(2);
  });
});