import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RetryPaymentConfirmComponent } from './retry-payment-confirm';

describe('RetryPaymentConfirmComponent', () => {
  let fixture: ComponentFixture<RetryPaymentConfirmComponent>;
  const dialogRefMock = { close: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetryPaymentConfirmComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'Riprova addebito', message: 'Riprova l\'addebito per Marta Rossi?' },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RetryPaymentConfirmComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the given title and message', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Riprova addebito');
    expect(el.textContent).toContain('Riprova l\'addebito per Marta Rossi?');
  });

  it('closes with true when the retry is confirmed', () => {
    const button = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Riprova addebito'));
    expect(button).toBeTruthy();
    button!.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('closes with false when Annulla is clicked', () => {
    const button = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Annulla'));
    expect(button).toBeTruthy();
    button!.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(false);
  });
});