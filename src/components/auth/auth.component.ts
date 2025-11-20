import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'auth-form',
  templateUrl: './auth.component.html',
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private authService = inject(AuthService);

  authMode = signal<'login' | 'register'>('login');
  username = signal('');
  password = signal('');
  confirmPassword = signal('');
  rememberMe = signal(false);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  toggleMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.errorMessage.set(null);
    this.username.set('');
    this.password.set('');
    this.confirmPassword.set('');
  }

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      if (this.authMode() === 'login') {
        this.authService.login(this.username(), this.password(), this.rememberMe());
      } else {
        if (this.password() !== this.confirmPassword()) {
          throw new Error('As senhas não coincidem.');
        }
        this.authService.register(this.username(), this.password());
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      this.isLoading.set(false);
    }
  }
}