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
        <h1>Contas</h1>
        <p-button label="Nova Conta" icon="pi pi-plus" (onClick)="openDialog()" />
      </div>

      @if (loading()) {
        <div class="cards-grid">
          @for (i of [1,2,3]; track i) { <p-skeleton height="140px" borderRadius="0.75rem" /> }
        </div>
      } @else if (accounts().length === 0) {
        <div class="py-16 text-center">
          <i class="pi pi-wallet text-4xl text-[var(--text-color-secondary)] mb-3 block"></i>
          <p class="text-[var(--text-color-secondary)]">Nenhuma conta cadastrada</p>
          <p-button label="Adicionar conta" class="mt-4" (onClick)="openDialog()" />
        </div>
      } @else {
        <div class="cards-grid">
          @for (acc of accounts(); track acc.id) {
            <div class="card" style="display:flex; flex-direction:column; gap:0.75rem;">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background:rgba(139,92,246,0.1);">
                    <i [class]="'pi ' + typeIcon(acc.type)" style="color:var(--primary)"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-[var(--text-color)]">{{ acc.name }}</p>
                    <p class="text-xs text-[var(--text-color-secondary)]">{{ acc.type | accountType }}</p>
                  </div>
                </div>
                <div class="flex gap-1">
                  <p-button icon="pi pi-pencil" [text]="true" size="small" (onClick)="openDialog(acc)" />
                  <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" (onClick)="confirmDelete(acc)" />
                </div>
              </div>
              <div>
                <p class="text-xs text-[var(--text-color-secondary)]">Saldo</p>
                <p class="text-xl font-bold" [class]="acc.balance >= 0 ? 'text-emerald-500' : 'text-red-500'">
                  {{ acc.balance | currency:'BRL':'symbol':'1.2-2' }}
                </p>
              </div>
              @if (acc.bankName) {
                <p class="text-xs text-[var(--text-color-secondary)]">
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
