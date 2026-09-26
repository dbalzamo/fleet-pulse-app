import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/envirornment-local';
import { CustomerService } from './customer-service';
import { CustomerPage } from '../../shared/models/payments-model';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiPath + environment.apiUrlCustomers;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CustomerService);
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

    it('returns the first page of customers', async () => {
      let result: CustomerPage | undefined;
      service.getCustomers().subscribe((res) => (result = res));
      await flushMockDelay(300);
      expect(result!.content).toHaveLength(6);
      expect(result!.totalElements).toBe(12);
    });

    it('searches customers by name', async () => {
      let result: CustomerPage | undefined;
      service.getCustomers({ search: 'rossi' }).subscribe((res) => (result = res));
      await flushMockDelay(300);
      expect(result!.content.every((c) => c.name.toLowerCase().includes('rossi'))).toBe(true);
    });

    it('paginates customers', async () => {
      let page1: CustomerPage | undefined;
      service.getCustomers({ page: 1 }).subscribe((res) => (page1 = res));
      await flushMockDelay(300);
      expect(page1!.content).toHaveLength(6);
      expect(page1!.totalElements).toBe(12);
    });
  });

  describe('http mode', () => {
    beforeEach(() => {
      environment.useMock = false;
    });

    it('GETs customers with search and page query params', () => {
      service.getCustomers({ search: 'marta', page: 1 }).subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === baseUrl);
      expect(req.request.params.get('search')).toBe('marta');
      expect(req.request.params.get('page')).toBe('1');
      req.flush({ content: [], totalElements: 0 });
    });

    it('omits empty search param', () => {
      service.getCustomers({}).subscribe();
      const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === baseUrl);
      expect(req.request.params.has('search')).toBe(false);
      req.flush({ content: [], totalElements: 0 });
    });
  });
});