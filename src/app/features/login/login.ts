import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthStore } from '../../core/stores/auth-store';
import { LoginReq } from '../../shared/models/auth-model';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule, MatInputModule, FormField, FormRoot, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authStore = inject(AuthStore);
  protected loginModel = signal<LoginReq>({
    username: '',
    password: '',
  });

  protected loginForm = form(this.loginModel, (schemaPath) => {
    // Username validation
    required(schemaPath.username, { message: 'Username is required' });
    // Password validation
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'At least 8 characters' });
  }, {
    submission: {
      action: async (field) => {
        this.authStore.login(field().value());
      }
    }
  });
}
