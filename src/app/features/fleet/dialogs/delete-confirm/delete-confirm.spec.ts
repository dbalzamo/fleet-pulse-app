import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteConfirmComponent } from './delete-confirm';

describe('DeleteConfirmComponent', () => {
  let fixture: ComponentFixture<DeleteConfirmComponent>;
  let component: DeleteConfirmComponent;
  const dialogRefMock = { close: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'Delete vehicle', message: 'Are you sure?' },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the given title and message', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Delete vehicle');
    expect(el.textContent).toContain('Are you sure?');
  });

  it('closes with true when the delete is confirmed', () => {
    const button = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Delete'));
    expect(button).toBeTruthy();
    button!.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('closes with false when the delete is cancelled', () => {
    const button = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Cancel'));
    expect(button).toBeTruthy();
    button!.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(false);
  });
});