import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerRowComponent } from './customer-row';
import { Customer } from '../../../shared/models/payments-model';

describe('CustomerRowComponent', () => {
  let fixture: ComponentFixture<CustomerRowComponent>;
  let component: CustomerRowComponent;

  const customer: Customer = { id: 'cust-001', name: 'Marta Rossi', totalRides: 27 };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerRowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerRowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('customer', customer);
    fixture.detectChanges();
  });

  it('renders the initials avatar and the customer name', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.customer-row__avatar')?.textContent?.trim()).toBe('MR');
    expect(el.textContent).toContain('Marta Rossi');
  });

  it('renders the number of rides', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.customer-row__rides')?.textContent).toContain('27 corse');
  });

  it('uses the singular form for a single ride', () => {
    fixture.componentRef.setInput('customer', { id: 'cust-002', name: 'Paolo Greco', totalRides: 1 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 corsa');
  });

  it('emits the customer when the row is clicked', () => {
    const emitted = vi.fn();
    component.open.subscribe(emitted);

    const button = fixture.nativeElement.querySelector('.customer-row__main') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(emitted).toHaveBeenCalledWith(customer);
  });
});