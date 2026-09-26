import { Component, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, minLength, required, validate } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../core/services/auth-service';
import { AuthStore } from '../../core/stores/auth-store';
import { NotificationService } from '../../core/services/notification-service';

export interface ChangePasswordFormModel {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

@Component({
    selector: 'app-account-page',
    imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormField, FormRoot],
    templateUrl: './account-page.html',
    styleUrl: './account-page.scss',
})
export class AccountPageComponent {
    private readonly authStore = inject(AuthStore);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(NotificationService);

    readonly currentUser = this.authStore.currentUser;
    readonly initial = computed(() => (this.currentUser()?.name ?? '?').trim().charAt(0).toUpperCase());

    protected readonly isSubmitting = signal(false);

    protected readonly model = signal<ChangePasswordFormModel>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    protected readonly passwordForm = form(this.model, (schemaPath) => {
        required(schemaPath.currentPassword, { message: 'Current password is required' });
        minLength(schemaPath.currentPassword, 8, { message: 'At least 8 characters' });
        required(schemaPath.newPassword, { message: 'New password is required' });
        minLength(schemaPath.newPassword, 8, { message: 'At least 8 characters' });
        required(schemaPath.confirmPassword, { message: 'Please confirm the new password' });
        validate(schemaPath.confirmPassword, ({ value, valueOf }) => {
            if (value() && valueOf(schemaPath.newPassword) && value() !== valueOf(schemaPath.newPassword)) {
                return { kind: 'passwordMismatch', message: 'New password and confirmation do not match' };
            }
            return null;
        });
    }, {
        submission: {
            action: async () => {
                const value = this.passwordForm().value();
                this.isSubmitting.set(true);
                try {
                    await firstValueFrom(
                        this.authService.changePassword({
                            currentPassword: value.currentPassword,
                            newPassword: value.newPassword,
                        }),
                    );
                    this.snackBar.success('Password updated successfully');
                    this.passwordForm().reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
                } finally {
                    this.isSubmitting.set(false);
                }
            },
        },
    });
}