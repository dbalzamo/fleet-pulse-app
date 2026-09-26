import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentsMetricsComponent } from './payments-metrics';
import { PaymentsSummary } from '../../../shared/models/payments-model';

describe('PaymentsMetricsComponent', () => {
  let fixture: ComponentFixture<PaymentsMetricsComponent>;
  let component: PaymentsMetricsComponent;

  const summary: PaymentsSummary = {
    todayRevenue: 1248.55,
    completedRides: 18,
    activeCustomers: 27,
    failedPayments: 4,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentsMetricsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsMetricsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summary', summary);
    fixture.detectChanges();
  });

  it('renders the four metric labels with the summary values', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.metric')).toHaveLength(4);
    expect(el.textContent).toContain('Incasso oggi');
    expect(el.textContent).toContain('Corse completate');
    expect(el.textContent).toContain('Clienti attivi');
    expect(el.textContent).toContain('Pagamenti falliti');
    expect(el.textContent).toContain('18');
    expect(el.textContent).toContain('27');
    expect(el.textContent).toContain('4');
  });

  it('formats the revenue with the CurrencyPipe', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('1,248.55');
    expect(el.textContent).toContain('€');
  });

  it('marks the failed payments card as danger when greater than zero', () => {
    const danger = fixture.nativeElement.querySelector('.metric--danger') as HTMLElement;
    expect(danger).not.toBeNull();
    expect(component['hasFailedPayments']()).toBe(true);
  });

  it('does not mark the failed payments card when there are no failures', () => {
    fixture.componentRef.setInput('summary', { ...summary, failedPayments: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.metric--danger')).toBeNull();
    expect(component['hasFailedPayments']()).toBe(false);
  });
});