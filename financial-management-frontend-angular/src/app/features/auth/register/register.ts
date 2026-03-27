import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputTextModule, PasswordModule, ButtonModule, CheckboxModule, MessageModule],
  template: `
    <!-- Soft UI Dashboard: gradient full-screen background -->
    <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style="background: linear-gradient(135deg, #6C5CE7 0%, #9A8CFF 50%, #00D4AA 100%)">

      <!-- decorative blobs -->
      <div class="absolute top-[-10%] left-[-5%] w-80 h-80 rounded-full opacity-15"
           style="background: radial-gradient(circle, #fff 0%, transparent 70%)"></div>
      <div class="absolute bottom-[-15%] right-[-8%] w-96 h-96 rounded-full opacity-15"
           style="background: radial-gradient(circle, #00D4AA 0%, transparent 70%)"></div>

      <div class="w-full max-w-md animate-fade-in-up relative z-10">

        <!-- Glass card -->
        <div class="bg-white dark:bg-[var(--color-surface)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-8 border border-white/30 backdrop-blur-xl">

          <!-- Logo badge + title -->
          <div class="flex flex-col items-center mb-8">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(108,92,231,0.45)]"
                 style="background: linear-gradient(135deg, #6C5CE7 0%, #00D4AA 100%)">
              <i class="pi pi-wallet text-white text-2xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-[var(--color-text)]">Criar conta</h1>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">Comece a gerenciar suas finanças</p>
          </div>

          @if (error()) {
            <p-message severity="error" [text]="error()!" styleClass="w-full mb-4" />
          }

          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Nome</label>
                <input pInputText formControlName="firstName" placeholder="João" class="w-full rounded-xl" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Sobrenome</label>
                <input pInputText formControlName="lastName" placeholder="Silva" class="w-full rounded-xl" />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">E-mail</label>
              <input pInputText type="email" formControlName="email" placeholder="seu@email.com" class="w-full rounded-xl" />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <small class="text-[var(--color-expense)]">E-mail inválido</small>
              }
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Senha</label>
              <p-password
                formControlName="password"
                placeholder="Mínimo 6 caracteres"
                [toggleMask]="true"
                styleClass="w-full"
                inputStyleClass="w-full rounded-xl"
              />
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <small class="text-[var(--color-expense)]">Mínimo 6 caracteres</small>
              }
            </div>

            <div class="flex items-start gap-2">
              <p-checkbox formControlName="lgpdConsent" [binary]="true" inputId="lgpd" />
              <label for="lgpd" class="text-sm text-[var(--color-text-muted)] cursor-pointer leading-relaxed">
                Concordo com os termos de uso e política de privacidade (LGPD)
              </label>
            </div>

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full mt-1 py-3 px-6 rounded-xl text-white font-semibold text-sm shadow-[0_4px_15px_rgba(108,92,231,0.4)] hover:shadow-[0_8px_24px_rgba(108,92,231,0.5)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style="background: linear-gradient(135deg, #6C5CE7 0%, #9A8CFF 100%)"
            >
              @if (loading()) {
                <i class="pi pi-spinner pi-spin mr-2"></i>
              }
              Criar conta
            </button>
          </form>

          <p class="text-center text-sm text-[var(--color-text-muted)] mt-6">
            Já tem conta?
            <a routerLink="/login" class="text-[var(--color-primary)] hover:underline font-semibold">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error   = signal<string | null>(null);

  form = this.fb.group({
    firstName:   ['', Validators.required],
    lastName:    ['', Validators.required],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(6)]],
    lgpdConsent: [false, Validators.requiredTrue],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password, firstName, lastName, lgpdConsent } = this.form.value;
    this.auth.register({ email: email!, password: password!, firstName: firstName!, lastName: lastName!, lgpdConsent: lgpdConsent! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erro ao criar conta');
        this.loading.set(false);
      },
    });
  }
}
