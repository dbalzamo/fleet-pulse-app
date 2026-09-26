import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { ConfirmLogoutComponent } from './confirm-logout';

describe('ConfirmLogoutComponent', () => {
  let fixture: ComponentFixture<ConfirmLogoutComponent>;
  const dialogRefMock = { close: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmLogoutComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmLogoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('closes with true when Esci is confirmed', () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];
    const confirmButton = buttons.find((b) => b.textContent?.includes('Esci')) as HTMLButtonElement;
    confirmButton.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('closes with false when Annulla is clicked', () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];
    const cancelButton = buttons.find((b) => b.textContent?.includes('Annulla')) as HTMLButtonElement;
    cancelButton.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(false);
  });
});