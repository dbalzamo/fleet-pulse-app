import { Component, inject, signal } from '@angular/core';
import { AuthStore } from '../../core/stores/auth-store';
import { RegisterFormModel } from '../../shared/models/auth-model';
import { email, form, minLength, required, FormRoot, FormField, validate } from '@angular/forms/signals';
import { FormWrapper } from '../../shared/components/form-wrapper/form-wrapper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  imports: [FormWrapper, FormRoot, MatFormFieldModule, FormField, MatInputModule, MatButtonModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly authStore = inject(AuthStore);
  protected registerModel = signal<RegisterFormModel>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  protected registerForm = form(this.registerModel, (schemaPath) => {
    // Username validation
    required(schemaPath.username, { message: 'Username is required' });
    minLength(schemaPath.username, 4, { message: 'At least 4 characters' });
    // Email validation
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email' });
    // Password validation
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'At least 8 characters' });
    // Confirm password validation
    required(schemaPath.confirmPassword, { message: 'Confirm Password is required' });
    // Custom validator to check value password !== confirPassword
    validate(schemaPath.confirmPassword, (ctx) => {
      if (ctx.valueOf(schemaPath.password) !== ctx.value()) {
        return { kind: 'validation', message: 'Passwords do not match' };
      }
      return null;
    });
  }, {
    submission: {
      action: async (field) => {
        const { confirmPassword, ...payload } = field().value();
        this.authStore.register(payload);
      }
    }
  })

}
