import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-[var(--color-surface)] rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-[var(--color-text)] mb-6 text-center">Finanças</h1>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-[var(--color-text)] mb-2">Email</label>
              <input
                pInputText
                type="email"
                formControlName="email"
                placeholder="seu@email.com"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-[var(--color-border)] rounded-lg bg-white dark:bg-[var(--color-surface)] text-gray-900 dark:text-[var(--color-text)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <small class="text-red-500">E-mail inválido</small>
              }
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-[var(--color-text)] mb-2">Senha</label>
              <div class="relative">
                <p-password
                  formControlName="password"
                  placeholder="Sua senha"
                  [feedback]="false"
                  [toggleMask]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full px-4 py-2.5 border border-gray-300 dark:border-[var(--color-border)] rounded-lg bg-white dark:bg-[var(--color-surface)] text-gray-900 dark:text-[var(--color-text)] focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
              </div>
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <small class="text-red-500">Senha obrigatória</small>
              }
            </div>
            @if (error()) {
              <div class="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {{ error() }}
              </div>
            }
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (loading()) {
                <i class="pi pi-spinner pi-spin mr-2"></i>
              }
              {{ loading() ? 'Carregando...' : 'Entrar' }}
            </button>
          </div>
        </form>
        <p class="text-center text-gray-600 dark:text-[var(--color-text-muted)] text-sm mt-4">
          Faça login com suas credenciais para acessar o dashboard
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error   = signal<string | null>(null);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Credenciais inválidas');
        this.loading.set(false);
      },
    });
  }
}
