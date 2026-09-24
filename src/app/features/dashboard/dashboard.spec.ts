import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders navigation links to the application routes', () => {
    const links = Array.from(element.querySelectorAll('a[routerLink]'));
    const targets = links.map((a) => a.getAttribute('routerLink'));
    expect(targets).toEqual(['/fleet', '/fleet/veh-001', '/control-center', '/dashboard', '/login', '/register']);
  });
});
