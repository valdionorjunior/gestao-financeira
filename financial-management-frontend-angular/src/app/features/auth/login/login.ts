import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputTextModule, PasswordModule, ButtonModule, MessageModule],
  template: `
    <!-- Soft UI Dashboard: gradient full-screen background -->
        <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
          style="background: linear-gradient(135deg, #6C5CE7 0%, #9A8CFF 50%, #00D4AA 100%)">

      <!-- decorative blobs -->
      <div class="absolute top-[-10%] right-[-5%] w-72 h-72 rounded-full opacity-20"
           style="background: radial-gradient(circle, #fff 0%, transparent 70%)"></div>
      <div class="absolute bottom-[-15%] left-[-8%] w-96 h-96 rounded-full opacity-15"
           style="background: radial-gradient(circle, #00D4AA 0%, transparent 70%)"></div>

      <div class="w-full max-w-md animate-fade-in-up relative z-10">

        <!-- Glass card -->
        <div class="bg-white dark:bg-[var(--color-surface)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-10 md:p-12 border border-[var(--color-border)] backdrop-blur-xl transition-all duration-200">

          <!-- Logo badge + title -->
          <div class="flex flex-col items-center mb-10">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(108,92,231,0.45)]"
                style="background: linear-gradient(135deg, #6C5CE7 0%, #00D4AA 100%)">
              <i class="pi pi-wallet text-white text-2xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-[var(--color-text)]">FinancePro</h1>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">Bem-vindo de volta!</p>
          </div>

          <!-- Error -->
          @if (error()) {
            <p-message severity="error" [text]="error()!" styleClass="w-full mb-4" />
          }

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-6">

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">E-mail</label>
              <input
                pInputText
                type="email"
                formControlName="email"
                placeholder="seu@email.com"
                class="w-full rounded-xl px-4 py-3 border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all duration-150"
              />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <small class="text-[var(--color-expense)]">E-mail inválido</small>
              }
            </div>

            <div class="flex flex-col gap-2 mt-1">
              <label class="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Senha</label>
              <p-password
                formControlName="password"
                placeholder="Sua senha"
                [feedback]="false"
                [toggleMask]="true"
                styleClass="w-full"
                inputStyleClass="w-full rounded-xl px-4 py-3 border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all duration-150"
              />
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <small class="text-[var(--color-expense)]">Senha obrigatória</small>
              }
            </div>

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full mt-3 py-3 px-6 rounded-xl text-white font-semibold text-base shadow-[0_4px_15px_rgba(108,92,231,0.4)] hover:shadow-[0_8px_24px_rgba(108,92,231,0.5)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed border-0"
              style="background: linear-gradient(135deg, #6C5CE7 0%, #9A8CFF 100%)"
            >
              @if (loading()) {
                <i class="pi pi-spinner pi-spin mr-2"></i>
              }
              Entrar
            </button>
          </form>

          <p class="text-center text-sm text-[var(--color-text-muted)] mt-8">
            Não tem conta?
            <a routerLink="/register" class="text-[var(--color-primary)] hover:underline font-semibold">Cadastre-se</a>
          </p>
        </div>
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
