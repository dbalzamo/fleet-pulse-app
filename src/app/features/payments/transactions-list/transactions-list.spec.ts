import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../core/services/notification-service';
import { PaymentsService } from '../../../core/services/payments-service';
import { Transaction } from '../../../shared/models/payments-model';
import { TransactionsListComponent } from './transactions-list';

describe('TransactionsListComponent', () => {
  let fixture: ComponentFixture<TransactionsListComponent>;
  let component: TransactionsListComponent;
  let paymentsMock: {
    getTransactions: ReturnType<typeof vi.fn>;
    retryPayment: ReturnType<typeof vi.fn>;
  };
  let notificationMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogMock: { open: ReturnType<typeof vi.fn> };

  const failedTxn: Transaction = {
    id: 'txn-1',
    customerName: 'Marta Rossi',
    rideId: 'ride-101',
    vehicleId: 'veh-001',
    amount: 12.5,
    currency: 'EUR',
    status: 'failed',
    timestamp: '2026-09-24T10:00:00.000Z',
  };
  const paidTxn: Transaction = {
    id: 'txn-2',
    customerName: 'Luca Bianchi',
    rideId: 'ride-102',
    vehicleId: 'veh-002',
    amount: 25,
    currency: 'EUR',
    status: 'paid',
    timestamp: '2026-09-24T09:00:00.000Z',
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    paymentsMock = {
      getTransactions: vi.fn().mockReturnValue(of({ content: [failedTxn, paidTxn], totalElements: 2 })),
      retryPayment: vi.fn(),
    };
    notificationMock = { success: vi.fn(), error: vi.fn() };
    dialogMock = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TransactionsListComponent],
      providers: [
        { provide: PaymentsService, useValue: paymentsMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: MatDialog, useValue: dialogMock },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createComponent(): Promise<ComponentFixture<TransactionsListComponent>> {
    const f = TestBed.createComponent(TransactionsListComponent);
    component = f.componentInstance;
    f.detectChanges();
    await vi.advanceTimersByTimeAsync(350);
    f.detectChanges();
    return f;
  }

  function setDialogResult(result: unknown): void {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(result) });
  }

  it('loads the first page and renders the transaction rows', async () => {
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(paymentsMock.getTransactions).toHaveBeenCalledTimes(1);
    expect(el.querySelectorAll('app-transaction-row')).toHaveLength(2);
    expect(el.textContent).toContain('Marta Rossi');
    expect(el.textContent).toContain('Fallito');
    expect(el.textContent).toContain('€12.50');
    expect(el.textContent).toContain('Mostrate 2 di 2');
  });

  it('reloads with the selected status after the debounce', async () => {
    fixture = await createComponent();
    component['statusFilter'].set('failed');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(350);
    fixture.detectChanges();

    const lastCall = paymentsMock.getTransactions.mock.calls.at(-1)?.[0];
    expect(lastCall.status).toBe('failed');
    expect(lastCall.page).toBe(0);
  });

  it('reloads with the selected date range after the debounce', async () => {
    fixture = await createComponent();
    component['fromDate'].set('2026-09-01');
    component['toDate'].set('2026-09-24');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(350);
    fixture.detectChanges();

    const lastCall = paymentsMock.getTransactions.mock.calls.at(-1)?.[0];
    expect(lastCall.from).toBe('2026-09-01');
    expect(lastCall.to).toBe('2026-09-24');
  });

  it('appends the next page when loading more', async () => {
    paymentsMock.getTransactions = vi.fn().mockImplementation(({ page } = {}) =>
      of(
        page === 1
          ? { content: [paidTxn], totalElements: 3 }
          : { content: [failedTxn, paidTxn], totalElements: 3 }
      )
    );
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Mostrate 2 di 3');
    const loadMore = (
      Array.from(el.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Carica altre')) as HTMLButtonElement;
    loadMore.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(100);
    fixture.detectChanges();

    expect(paymentsMock.getTransactions).toHaveBeenCalledTimes(2);
    expect(el.querySelectorAll('app-transaction-row')).toHaveLength(3);
    expect(el.textContent).toContain('Mostrate 3 di 3');
    const remaining = (
      Array.from(el.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Carica altre'));
    expect(remaining).toBeUndefined();
  });

  it('confirms before retrying and updates only the changed row', async () => {
    setDialogResult(true);
    paymentsMock.retryPayment.mockReturnValue(of({ ...failedTxn, status: 'processing' }));
    fixture = await createComponent();
    const el = fixture.nativeElement as HTMLElement;

    const retryButton = el.querySelector('.transaction-row__retry') as HTMLButtonElement;
    retryButton.click();
    await vi.advanceTimersByTimeAsync(100);
    fixture.detectChanges();

    expect(dialogMock.open).toHaveBeenCalled();
    expect(paymentsMock.retryPayment).toHaveBeenCalledWith('txn-1');
    // single-row update, no full list reload
    expect(paymentsMock.getTransactions).toHaveBeenCalledTimes(1);
    expect(el.textContent).toContain('In elaborazione');
    expect(notificationMock.success).toHaveBeenCalled();
  });

  it('does not retry when the confirmation is dismissed', async () => {
    setDialogResult(false);
    fixture = await createComponent();

    const retryButton = fixture.nativeElement.querySelector('.transaction-row__retry') as HTMLButtonElement;
    retryButton.click();
    await vi.advanceTimersByTimeAsync(100);

    expect(paymentsMock.retryPayment).not.toHaveBeenCalled();
  });

  it('shows an error notification when the retry fails', async () => {
    setDialogResult(true);
    paymentsMock.retryPayment.mockReturnValue(throwError(() => new Error('boom')));
    fixture = await createComponent();

    const retryButton = fixture.nativeElement.querySelector('.transaction-row__retry') as HTMLButtonElement;
    retryButton.click();
    await vi.advanceTimersByTimeAsync(100);
    fixture.detectChanges();

    expect(notificationMock.error).toHaveBeenCalled();
    expect(component['retryingIds']()).toEqual([]);
  });

  it('resets the filters when the reset button is used', async () => {
    fixture = await createComponent();
    component['fromDate'].set('2026-09-01');
    component['statusFilter'].set('failed');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(350);

    const resetButton = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Reset')) as HTMLButtonElement;
    resetButton.click();
    fixture.detectChanges();

    expect(component['fromDate']()).toBe('');
    expect(component['statusFilter']()).toBe('all');
  });
});