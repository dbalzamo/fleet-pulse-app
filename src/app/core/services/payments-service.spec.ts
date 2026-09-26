import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/envirornment-local';
import { PaymentsService } from './payments-service';
import { PaymentsSummary, TransactionPage } from '../../shared/models/payments-model';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiPath + environment.apiUrlPayments;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    environment.useMock = true;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('mock mode', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      environment.useMock = true;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function flushMockDelay(ms: number): Promise<void> {
      await vi.advanceTimersByTimeAsync(ms);
    }

    it('returns the payments summary', async () => {
      let result: PaymentsSummary | undefined;
      service.getSummary().subscribe((res) => (result = res));
      await flushMockDelay(300);
      expect(result).toBeDefined();
      expect(result!.todayRevenue).toBeGreaterThan(0);
      expect(result!.completedRides).toBeGreaterThan(0);
      expect(result!.activeCustomers).toBeGreaterThan(0);
      expect(result!.failedPayments).toBeGreaterThan(0);
    });

    it('returns the first page of transactions sorted by date', async () => {
      let result: TransactionPage | undefined;
      service.getTransactions().subscribe((res) => (result = res));
      await flushMockDelay(450);
      expect(result!.content).toHaveLength(8);
      expect(result!.totalElements).toBe(24);
    });

    it('filters transactions by status', async () => {
      let result: TransactionPage | undefined;
      service.getTransactions({ status: 'failed' }).subscribe((res) => (result = res));
      await flushMockDelay(450);
      expect(result!.content.every((t) => t.status === 'failed')).toBe(true);
    });

    it('filters transactions by date range', async () => {
      const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const to = new Date().toISOString().slice(0, 10);
      let result: TransactionPage | undefined;
      service.getTransactions({ from, to }).subscribe((res) => (result = res));
      await flushMockDelay(450);
      expect(result!.content.length).toBeGreaterThan(0);
      expect(result!.content.every((t) => t.timestamp.slice(0, 10) >= from && t.timestamp.slice(0, 10) <= to)).toBe(true);
    });

    it('paginates transactions', async () => {
      let page0: TransactionPage | undefined;
      service.getTransactions({ page: 0 }).subscribe((res) => (page0 = res));
      await flushMockDelay(450);

      let page2: TransactionPage | undefined;
      service.getTransactions({ page: 2 }).subscribe((res) => (page2 = res));
      await flushMockDelay(450);

      expect(page0!.totalElements).toBe(24);
      expect(page0!.content).toHaveLength(8);
      expect(page2!.content).toHaveLength(8);
      expect(page2!.content[0].id).not.toBe(page0!.content[0].id);
    });

    it('retries a failed payment and moves the row to processing', async () => {
      let updated: { status: string } | undefined;
      service.retryPayment('txn-004').subscribe((res) => (updated = res));
      await flushMockDelay(550);
      expect(updated?.status).toBe('processing');

      let result: TransactionPage | undefined;
      service.getTransactions({ status: 'processing' }).subscribe((res) => (result = res));
      await flushMockDelay(450);
      expect(result!.content.some((t) => t.id === 'txn-004')).toBe(true);
    });
  });

  describe('http mode', () => {
    beforeEach(() => {
      environment.useMock = false;
    });

    it('GETs the payments summary', () => {
      service.getSummary().subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === `${baseUrl}/summary`);
      req.flush({ todayRevenue: 100, completedRides: 2, activeCustomers: 3, failedPayments: 1 });
    });

    it('GETs transactions with filter and page query params', () => {
      service
        .getTransactions({ from: '2026-09-01', to: '2026-09-24', status: 'failed', page: 2 })
        .subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === `${baseUrl}/transactions`);
      expect(req.request.params.get('from')).toBe('2026-09-01');
      expect(req.request.params.get('to')).toBe('2026-09-24');
      expect(req.request.params.get('status')).toBe('failed');
      expect(req.request.params.get('page')).toBe('2');
      req.flush({ content: [], totalElements: 0 });
    });

    it('omits empty filter params', () => {
      service.getTransactions({}).subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === `${baseUrl}/transactions`);
      expect(req.request.params.has('status')).toBe(false);
      req.flush({ content: [], totalElements: 0 });
    });

    it('POSTs to retry a transaction by id', () => {
      service.retryPayment('txn-1').subscribe();
      const req = httpMock.expectOne(
        (r) => r.method === 'POST' && r.url === `${baseUrl}/transactions/txn-1/retry`
      );
      req.flush({ id: 'txn-1', status: 'processing' });
    });
  });
});