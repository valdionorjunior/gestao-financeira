import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import type { Account } from '../../core/models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AccountTypePipe } from '../../shared/pipes/label.pipes';

const ACCOUNT_TYPES = [
  { label: 'Conta Corrente',   value: 'CHECKING' },
  { label: 'Poupança',         value: 'SAVINGS' },
  { label: 'Investimento',     value: 'INVESTMENT' },
  { label: 'Cartão de Crédito',value: 'CREDIT_CARD' },
  { label: 'Dinheiro',         value: 'CASH' },
  { label: 'Carteira Digital', value: 'DIGITAL_WALLET' },
];

const TYPE_ICON: Record<string, string> = {
  CHECKING: 'pi-building-columns', SAVINGS: 'pi-piggy-bank',
  INVESTMENT: 'pi-chart-line', CREDIT_CARD: 'pi-credit-card',
  CASH: 'pi-money-bill', DIGITAL_WALLET: 'pi-mobile',
};

@Component({
  selector: 'app-accounts',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CurrencyPipe, ReactiveFormsModule,
    CardModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, InputNumberModule,
    SkeletonModule, ConfirmDialogModule, AccountTypePipe,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Contas</h1>
          <p class="page-subtitle">Gerencie suas contas bancárias e carteiras</p>
        </div>
        <p-button label="Nova Conta" icon="pi pi-plus" (onClick)="openDialog()" />
      </div>

      @if (loading()) {
        <div class="cards-grid">
          @for (i of [1,2,3]; track i) { <p-skeleton height="160px" borderRadius="1.25rem" /> }
        </div>
      } @else if (accounts().length === 0) {
        <div class="empty-hero">
          <div class="empty-icon-circle">
            <i class="pi pi-wallet"></i>
          </div>
          <p class="empty-title">Nenhuma conta cadastrada</p>
          <p class="empty-desc">Adicione sua primeira conta para começar a gerenciar suas finanças</p>
          <p-button label="Adicionar conta" icon="pi pi-plus" (onClick)="openDialog()" />
        </div>
      } @else {
        <div class="cards-grid">
          @for (acc of accounts(); track acc.id) {
            <div class="account-card">
              <div class="account-card-bar" [class]="'bar-' + acc.type.toLowerCase()"></div>
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="account-icon" [class]="'icon-' + acc.type.toLowerCase()">
                    <i [class]="'pi ' + typeIcon(acc.type)"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-[var(--text-primary)]">{{ acc.name }}</p>
                    <p class="text-xs text-[var(--text-secondary)]">{{ acc.type | accountType }}</p>
                  </div>
                </div>
                <div class="flex gap-1">
                  <p-button icon="pi pi-pencil" [text]="true" size="small" (onClick)="openDialog(acc)" />
                  <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" (onClick)="confirmDelete(acc)" />
                </div>
              </div>
              <div class="account-balance-section">
                <p class="text-xs text-[var(--text-secondary)]">Saldo</p>
                <p class="account-balance" [class]="acc.balance >= 0 ? 'positive' : 'negative'">
                  {{ acc.balance | currency:'BRL':'symbol':'1.2-2' }}
                </p>
              </div>
              @if (acc.bankName) {
                <p class="text-xs text-[var(--text-secondary)]">
                  <i class="pi pi-building mr-1"></i>{{ acc.bankName }}
                </p>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editId() ? 'Editar Conta' : 'Nova Conta'"
      [modal]="true"
      [style]="{width: '420px'}"
    >
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Nome</label>
          <input pInputText formControlName="name" placeholder="Ex: Banco do Brasil" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Tipo</label>
          <p-select [options]="accountTypes" optionLabel="label" optionValue="value" formControlName="type" styleClass="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Saldo inicial</label>
          <p-inputnumber formControlName="balance" mode="decimal" [minFractionDigits]="2" placeholder="0,00" styleClass="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Banco (opcional)</label>
          <input pInputText formControlName="bankName" placeholder="Ex: Bradesco" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancelar" [text]="true" (onClick)="dialogVisible = false" />
          <p-button type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>

    <p-confirmDialog />
  `,
  styles: [`
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
      font-weight: 400;
    }
    .empty-hero {
      text-align: center;
      padding: 4rem 1rem;
      animation: fadeInUp 0.5s ease-out;
    }
    .empty-icon-circle {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(0, 212, 170, 0.08));
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-icon-circle i {
      font-size: 2rem;
      color: var(--primary-500, #6C5CE7);
    }
    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .empty-desc {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }
    .account-card {
      background: var(--surface-card, #fff);
      border-radius: var(--radius-xl, 24px);
      padding: 1.75rem;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }
    .account-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-xl, 0 12px 32px rgba(108, 92, 231, 0.18));
    }
    .account-card-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }
    .bar-checking     { background: var(--gradient-primary); }
    .bar-savings      { background: var(--gradient-secondary); }
    .bar-investment   { background: linear-gradient(135deg, #3B82F6, #60A5FA); }
    .bar-credit_card  { background: var(--gradient-accent); }
    .bar-cash         { background: linear-gradient(135deg, #F59E0B, #FBBF24); }
    .bar-digital_wallet { background: linear-gradient(135deg, #6C5CE7, #00D4AA); }
    .account-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg, 20px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      transition: transform 0.2s;
    }
    .account-icon:hover { transform: scale(1.08) rotate(5deg); }
    .icon-checking     { background: rgba(108, 92, 231, 0.1); color: #6C5CE7; }
    .icon-savings      { background: rgba(0, 212, 170, 0.1); color: #00D4AA; }
    .icon-investment   { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
    .icon-credit_card  { background: rgba(255, 107, 107, 0.1); color: #FF6B6B; }
    .icon-cash         { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
    .icon-digital_wallet { background: rgba(108, 92, 231, 0.1); color: #6C5CE7; }
    .account-balance-section {
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-border, rgba(108, 92, 231, 0.08));
    }
    .account-balance {
      font-size: 1.5rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
    }
    .account-balance.positive {
      background: var(--gradient-secondary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .account-balance.negative { color: var(--accent-500, #FF6B6B); }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 768px) {
      .account-card { padding: 1.25rem; }
      .account-balance { font-size: 1.25rem; }
    }
  `],
})
export class AccountsComponent implements OnInit {
  private finance = inject(FinanceService);
  private fb      = inject(FormBuilder);
  private confirm = inject(ConfirmationService);

  loading  = signal(true);
  saving   = signal(false);
  accounts = signal<Account[]>([]);
  editId   = signal<string | null>(null);
  dialogVisible = false;

  accountTypes = ACCOUNT_TYPES;

  form = this.fb.group({
    name:     ['', Validators.required],
    type:     ['CHECKING', Validators.required],
    balance:  [0],
    bankName: [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.finance.getAccounts().subscribe({
      next: a => { this.accounts.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  typeIcon(type: string) { return TYPE_ICON[type] ?? 'pi-wallet'; }

  openDialog(acc?: Account) {
    this.editId.set(acc?.id ?? null);
    if (acc) {
      this.form.patchValue({ name: acc.name, type: acc.type, balance: acc.balance ?? 0, bankName: acc.bankName ?? '' });
    } else {
      this.form.reset({ type: 'CHECKING', balance: 0 });
    }
    this.dialogVisible = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;
    const op = this.editId()
      ? this.finance.updateAccount(this.editId()!, v as Partial<Account>)
      : this.finance.createAccount(v as Partial<Account>);
    op.subscribe({
      next: () => { this.dialogVisible = false; this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(acc: Account) {
    this.confirm.confirm({
      message: `Excluir conta "${acc.name}"?`,
      header: 'Confirmar exclusão',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.finance.deleteAccount(acc.id).subscribe(() => this.load()),
    });
  }
}
