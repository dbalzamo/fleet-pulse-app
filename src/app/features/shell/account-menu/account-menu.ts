import { computed, Component, HostListener, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

export interface AccountMenuUser {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

@Component({
    selector: 'app-account-menu',
    imports: [MatIconModule, RouterLink, ClickOutsideDirective],
    templateUrl: './account-menu.html',
    styleUrl: './account-menu.scss',
})
export class AccountMenuComponent {
    readonly user = input<AccountMenuUser | null>(null);
    readonly logout = output<void>();

    readonly isOpen = signal(false);
    readonly initial = computed(() => (this.user()?.name ?? '?').trim().charAt(0).toUpperCase());

    toggle(): void {
        this.isOpen.update((open) => !open);
    }

    open(): void {
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
    }

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        this.close();
    }

    onLogout(): void {
        this.close();
        this.logout.emit();
    }
}