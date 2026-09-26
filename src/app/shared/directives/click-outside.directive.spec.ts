import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  standalone: true,
  imports: [ClickOutsideDirective],
  template: `<div class="host" appClickOutside (appClickOutside)="onOutside()">inside</div>`,
})
class HostComponent {
  onOutside = vi.fn();
}

describe('ClickOutsideDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('emits when clicking outside the host element', () => {
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(component.onOutside).toHaveBeenCalledTimes(1);
  });

  it('does not emit when clicking inside the host element', () => {
    const inside = fixture.nativeElement.querySelector('.host') as HTMLElement;
    inside.click();
    expect(component.onOutside).not.toHaveBeenCalled();
  });

  it('emits when pressing the Escape key', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.onOutside).toHaveBeenCalledTimes(1);
  });
});