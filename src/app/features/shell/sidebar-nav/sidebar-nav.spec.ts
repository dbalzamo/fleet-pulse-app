import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';

import { SidebarNavComponent } from './sidebar-nav';
import { SidebarNavItem, SIDEBAR_NAV_ITEMS } from './sidebar-nav.model';

@Component({
    standalone: true,
    selector: 'app-route-stub',
    template: '',
})
class RouteStubComponent {}

describe('SidebarNavComponent', () => {
  let fixture: ComponentFixture<SidebarNavComponent>;
  let component: SidebarNavComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarNavComponent],
      providers: [
        provideRouter([
          { path: 'fleet', component: RouteStubComponent },
          { path: 'dashboard', component: RouteStubComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarNavComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', SIDEBAR_NAV_ITEMS);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one link per item plus the separate logout button', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.sidebar__link').length).toBe(SIDEBAR_NAV_ITEMS.length + 1);
    expect(el.querySelectorAll('.sidebar__link--logout').length).toBe(1);
  });

  it('exposes the route and a native tooltip for every item', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('.sidebar__nav .sidebar__link')) as HTMLAnchorElement[];
    expect(links.length).toBe(SIDEBAR_NAV_ITEMS.length);
    expect(links[0].getAttribute('href')).toBe('/dashboard');
    expect(links[0].getAttribute('title')).toBe('Dashboard');
    expect(links[1].getAttribute('href')).toBe('/fleet');
  });

  it('highlights the active route', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/fleet');
    fixture.detectChanges();

    const active = fixture.nativeElement.querySelector('.sidebar__link--active') as HTMLElement;
    expect(active).not.toBeNull();
    expect(active.textContent).toContain('directions_car');
  });

  it('emits logout when the bottom button is clicked', () => {
    const emitted = vi.fn();
    component.logout.subscribe(emitted);

    const button = fixture.nativeElement.querySelector('.sidebar__link--logout') as HTMLButtonElement;
    button.click();

    expect(emitted).toHaveBeenCalledTimes(1);
  });
});