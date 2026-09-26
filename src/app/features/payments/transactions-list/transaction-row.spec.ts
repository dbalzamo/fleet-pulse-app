import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TransactionRowComponent } from './transaction-row';
import { Transaction } from '../../../shared/models/payments-model';

describe('TransactionRowComponent', () => {
  let fixture: ComponentFixture<TransactionRowComponent>;
  let component: TransactionRowComponent;

  const paid: Transaction = {
    id: 'txn-1',
    customerName: 'Marta Rossi',
    rideId: 'ride-101',
    vehicleId: 'veh-001',
    amount: 12.5,
    currency: 'EUR',
    status: 'paid',
    timestamp: new Date().toISOString(),
  };

  const failed: Transaction = { ...paid, id: 'txn-2', status: 'failed', amount: 30 };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionRowComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionRowComponent);
    component = fixture.componentInstance;
  });

  it('renders customer, linked ride, formatted amount and payment badge', () => {
    fixture.componentRef.setInput('transaction', paid);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Marta Rossi');
    expect(el.querySelector('a[href="/fleet/veh-001"]')?.textContent).toContain('ride-101');
    expect(el.textContent).toContain('€12.50');
    expect(el.textContent).toContain('Pagato');
  });

  it('formats the timestamp with the DatePipe', () => {
    fixture.componentRef.setInput('transaction', paid);
    fixture.detectChanges();

    const time = fixture.nativeElement.querySelector('.transaction-row__time') as HTMLElement;
    expect(time.textContent).toMatch(/^\d{2} [A-Za-z]{3}, \d{2}:\d{2}$/);
  });

  it('shows the retry action only for failed transactions', () => {
    fixture.componentRef.setInput('transaction', paid);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.transaction-row__retry')).toBeNull();

    fixture.componentRef.setInput('transaction', failed);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.transaction-row__retry')).not.toBeNull();
  });

  it('emits the transaction when the retry action is used', () => {
    fixture.componentRef.setInput('transaction', failed);
    fixture.detectChanges();

    const emitted = vi.fn();
    component.retry.subscribe(emitted);

    const button = fixture.nativeElement.querySelector('.transaction-row__retry') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(emitted).toHaveBeenCalledWith(failed);
  });

  it('disables the retry button and shows a spinner while retrying', () => {
    fixture.componentRef.setInput('transaction', failed);
    fixture.componentRef.setInput('retrying', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.transaction-row__retry') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Riprova in corso');
    expect(fixture.nativeElement.querySelector('mat-progress-spinner')).not.toBeNull();
  });
});