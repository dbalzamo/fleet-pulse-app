import { Component, computed, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';

import { AuthStore } from '../../core/stores/auth-store';
import { AccountMenuComponent, AccountMenuUser } from './account-menu/account-menu';
import { SidebarNavComponent } from './sidebar-nav/sidebar-nav';
import { SIDEBAR_NAV_ITEMS } from './sidebar-nav/sidebar-nav.model';
import { ConfirmLogoutComponent } from './dialogs/confirm-logout/confirm-logout';

@Component({
    selector: 'app-shell',
    imports: [RouterOutlet, MatIconModule, SidebarNavComponent, AccountMenuComponent],
    templateUrl: './app-shell.html',
    styleUrl: './app-shell.scss',
})
export class AppShellComponent implements OnInit {
    private readonly authStore = inject(AuthStore);
    private readonly dialog = inject(MatDialog);

    readonly navItems = [...SIDEBAR_NAV_ITEMS];

    readonly currentUser = this.authStore.currentUser;
    readonly menuUser = computed<AccountMenuUser | null>(() => {
        const user = this.currentUser();
        return user ? { name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } : null;
    });

    readonly greetingName = computed(() => this.currentUser()?.name ?? '');
    readonly todayLabel = computed(() =>
        new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
    );

    ngOnInit(): void {
        this.authStore.loadCurrentUser();
    }

    onLogout(): void {
        const dialogRef = this.dialog.open(ConfirmLogoutComponent, { data: {} });
        dialogRef.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.authStore.logout();
            }
        });
    }
}