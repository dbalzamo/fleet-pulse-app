import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SidebarNavItem } from './sidebar-nav.model';

@Component({
    selector: 'app-sidebar-nav',
    imports: [MatIconModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar-nav.html',
    styleUrl: './sidebar-nav.scss',
})
export class SidebarNavComponent {
    readonly items = input<SidebarNavItem[]>([]);
    readonly logoutLabel = input('Logout');
    readonly logout = output<void>();

    handleLogout(): void {
        this.logout.emit();
    }
}