import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AccountMenuComponent, AccountMenuUser } from './account-menu';

describe('AccountMenuComponent', () => {
  let fixture: ComponentFixture<AccountMenuComponent>;
  let component: AccountMenuComponent;

  const user: AccountMenuUser = {
    name: 'Jhon Black',
    email: 'jhon.black@fleetpulse.io',
    role: 'Fleet Manager',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountMenuComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();
  });

  it('renders the avatar with the initial of the user name', () => {
    const avatar = fixture.nativeElement.querySelector('.account-menu__avatar--fallback') as HTMLElement;
    expect(avatar.textContent).toBe('J');
  });

  it('is closed by default and opens when the trigger is clicked', () => {
    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.account-menu__dropdown')).toBeNull();

    const trigger = fixture.nativeElement.querySelector('.account-menu__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('.account-menu__dropdown')).not.toBeNull();
  });

  it('closes when clicking outside the menu', () => {
    component.open();
    fixture.detectChanges();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('closes when pressing the Escape key', () => {
    component.open();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('shows account, settings and logout entries once opened', () => {
    component.open();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.account-menu__item').length).toBe(3);
    expect(el.textContent).toContain('Il mio account');
    expect(el.textContent).toContain('Impostazioni');
    expect(el.textContent).toContain('Esci');
    expect(el.querySelector('a[href="/account"]')).not.toBeNull();
    expect(el.querySelector('a[href="/settings"]')).not.toBeNull();
  });

  it('emits logout and closes the dropdown when Esci is clicked', () => {
    const emitted = vi.fn();
    component.logout.subscribe(emitted);
    component.open();
    fixture.detectChanges();

    const logoutButton = fixture.nativeElement.querySelector('.account-menu__item--danger') as HTMLButtonElement;
    logoutButton.click();
    fixture.detectChanges();

    expect(emitted).toHaveBeenCalledTimes(1);
    expect(component.isOpen()).toBe(false);
  });
});