import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import type { Transaction, Category, Account } from '../../core/models';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TxTypePipe, TxStatusPipe } from '../../shared/pipes/label.pipes';
import { SafeDatePipe } from '../../shared/pipes/safe-date.pipe';

const TX_TYPES   = [
  { label: 'Receita',        value: 'INCOME' },
  { label: 'Despesa',        value: 'EXPENSE' },
  { label: 'Transferência',  value: 'TRANSFER' },
];
const TX_STATUSES = [
  { label: 'Pendente',    value: 'PENDING' },
  { label: 'Concluída',   value: 'COMPLETED' },
  { label: 'Cancelada',   value: 'CANCELLED' },
];

@Component({
  selector: 'app-transactions',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CurrencyPipe, DatePipe, ReactiveFormsModule, FormsModule,
    TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, DatePickerModule, InputNumberModule,
    TagModule, SkeletonModule, ConfirmDialogModule, TxTypePipe, TxStatusPipe, SafeDatePipe,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Transações</h1>
        <p-button label="Nova Transação" icon="pi pi-plus" (onClick)="openDialog()" />
      </div>

      <!-- Filters -->
      <div class="card" style="padding:1.25rem; display:flex; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.5rem;">
        <p-select
          [options]="txTypes"
          optionLabel="label"
          optionValue="value"
          placeholder="Tipo"
          [showClear]="true"
          [(ngModel)]="filterType"
          (ngModelChange)="load()"
          styleClass="min-w-36"
        />
        <p-select
          [options]="txStatuses"
          optionLabel="label"
          optionValue="value"
          placeholder="Status"
          [showClear]="true"
          [(ngModel)]="filterStatus"
          (ngModelChange)="load()"
          styleClass="min-w-36"
        />
        <p-select
          [options]="accounts()"
          optionLabel="name"
          optionValue="id"
          placeholder="Conta"
          [showClear]="true"
          [(ngModel)]="filterAccount"
          (ngModelChange)="load()"
          styleClass="min-w-40"
        />
      </div>

      <!-- Table -->
      <div class="card" style="padding:0; overflow:hidden;">
        <p-table
          [value]="transactions()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="15"
          [totalRecords]="total()"
          [lazy]="true"
          (onLazyLoad)="onLazy($event)"
          responsiveLayout="scroll"
          styleClass="p-datatable-sm"
        >
          <ng-template #header>
            <tr>
              <th>Descrição</th>
              <th>Data</th>
              <th>Tipo</th>
              <th>Status</th>
              <th class="text-right">Valor</th>
              <th class="w-24"></th>
            </tr>
          </ng-template>
          <ng-template #body let-tx>
            <tr>
              <td class="text-sm">
                <!-- Ícone de tipo inline p/ leitores de tela e daltonismo -->
                <span class="inline-flex items-center gap-1.5">
                  <i class="text-xs"
                     [class]="tx.type === 'INCOME' ? 'pi pi-arrow-down' : tx.type === 'EXPENSE' ? 'pi pi-arrow-up' : 'pi pi-arrows-h'"
                     [style.color]="tx.type === 'INCOME' ? 'var(--color-income)' : tx.type === 'EXPENSE' ? 'var(--color-expense)' : 'var(--color-transfer)'"
                     [attr.aria-label]="tx.type | txType"></i>
                  {{ tx.description }}
                </span>
              </td>
              <td class="text-sm text-[var(--color-text-muted)]">{{ tx.date | safeDate }}</td>
              <td>
                <!-- Chip semântico com cor CSS var (não depende apenas de verde/vermelho) -->
                <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      [style.background-color]="tx.type === 'INCOME' ? 'var(--color-income-bg)' : tx.type === 'EXPENSE' ? 'var(--color-expense-bg)' : 'var(--color-transfer-bg)'"
                      [style.color]="tx.type === 'INCOME' ? 'var(--color-income)' : tx.type === 'EXPENSE' ? 'var(--color-expense)' : 'var(--color-transfer)'">
                  {{ tx.type | txType }}
                </span>
              </td>
              <td>
                <p-tag
                  [value]="tx.status | txStatus"
                  [severity]="tx.status === 'COMPLETED' ? 'success' : tx.status === 'PENDING' ? 'warn' : 'secondary'"
                />
              </td>
              <td class="text-right font-semibold text-sm"
                  [style.color]="tx.type === 'INCOME' ? 'var(--color-income)' : tx.type === 'EXPENSE' ? 'var(--color-expense)' : 'var(--color-transfer)'">
                {{ tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '' }}{{ tx.amount | currency:'BRL':'symbol':'1.2-2' }}
              </td>
              <td>
                <div class="flex gap-1">
                  <p-button icon="pi pi-pencil" [text]="true" size="small" (onClick)="openDialog(tx)" />
                  <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" (onClick)="confirmDelete(tx)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="6" class="py-10 text-center text-[var(--text-color-secondary)]">Nenhuma transação encontrada</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editId() ? 'Editar Transação' : 'Nova Transação'"
      [modal]="true"
      [style]="{width: '480px'}"
      styleClass="rounded-xl"
    >
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4 py-2">

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Descrição</label>
          <input pInputText formControlName="description" placeholder="Ex: Salário" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-[var(--text-color)]">Valor</label>
            <p-inputnumber formControlName="amount" mode="decimal" [minFractionDigits]="2" placeholder="0,00" styleClass="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-[var(--text-color)]">Data</label>
            <p-datepicker formControlName="date" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-[var(--text-color)]">Tipo</label>
            <p-select [options]="txTypes" optionLabel="label" optionValue="value" formControlName="type" styleClass="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-[var(--text-color)]">Status</label>
            <p-select [options]="txStatuses" optionLabel="label" optionValue="value" formControlName="status" styleClass="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Conta</label>
          <p-select [options]="accounts()" optionLabel="name" optionValue="id" formControlName="accountId" placeholder="Selecione" styleClass="w-full" />
        </div>

        @if (form.get('type')?.value === 'TRANSFER') {
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-[var(--text-color)]">Conta de Destino</label>
            <p-select 
              [options]="accounts().filter(a => a.id !== form.get('accountId')?.value)" 
              optionLabel="name" 
              optionValue="id" 
              formControlName="destinationAccountId" 
              placeholder="Selecione" 
              styleClass="w-full" 
            />
          </div>
        } @else {
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-[var(--text-color)]">Categoria</label>
            <p-select [options]="categories()" optionLabel="name" optionValue="id" formControlName="categoryId" placeholder="Selecione" [showClear]="true" styleClass="w-full" />
          </div>

          @if (subcategories().length > 0) {
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-[var(--text-color)]">Subcategoria</label>
              <p-select [options]="subcategories()" optionLabel="name" optionValue="id" formControlName="subcategoryId" placeholder="Selecione" [showClear]="true" styleClass="w-full" />
            </div>
          }
        }

        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancelar" [text]="true" (onClick)="dialogVisible = false" />
          <p-button type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>

    <p-confirmDialog />
  `,
})
export class TransactionsComponent implements OnInit {
  private finance = inject(FinanceService);
  private fb      = inject(FormBuilder);
  private confirm = inject(ConfirmationService);

  loading    = signal(true);
  saving     = signal(false);
  transactions = signal<Transaction[]>([]);
  total      = signal(0);
  accounts   = signal<Account[]>([]);
  categories = signal<Category[]>([]);
  subcategories = signal<any[]>([]);
  editId     = signal<string | null>(null);
  dialogVisible = false;

  filterType    : string | null = null;
  filterStatus  : string | null = null;
  filterAccount : string | null = null;

  page  = 1;
  limit = 15;

  txTypes    = TX_TYPES;
  txStatuses = TX_STATUSES;

  form = this.fb.group({
    description: [''],
    amount:      [null as number | null],
    date:        [new Date()],
    type:        ['EXPENSE'],
    status:      ['COMPLETED'],
    accountId:   [''],
    categoryId:  [null as string | null],
    subcategoryId: [null as string | null],
    destinationAccountId: [null as string | null],
  });

  ngOnInit() {
    this.finance.getAccounts().subscribe(a => this.accounts.set(a));
    this.finance.getCategories().subscribe(c => this.categories.set(c));
    
    // Update subcategories when categoryId changes
    effect(() => {
      const catId = this.form.get('categoryId')?.value;
      if (catId) {
        const selected = this.categories().find(c => c.id === catId);
        this.subcategories.set(selected?.subcategories || []);
      } else {
        this.subcategories.set([]);
      }
    });

    this.load();
  }

  load() {
    this.loading.set(true);
    this.finance.getTransactions({
      page: this.page,
      limit: this.limit,
      type:       this.filterType    ?? undefined,
      status:     this.filterStatus  ?? undefined,
      accountId:  this.filterAccount ?? undefined,
    }).subscribe({
      next: r => {
        this.transactions.set(r.data ?? []);
        this.total.set(r.total ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onLazy(e: any) {
    this.page  = Math.floor(e.first / e.rows) + 1;
    this.limit = e.rows;
    this.load();
  }

  openDialog(tx?: Transaction) {
    this.editId.set(tx?.id ?? null);
    if (tx) {
      this.form.patchValue({
        description: tx.description,
        amount:      tx.amount,
        date:        new Date(tx.date),
        type:        tx.type,
        status:      tx.status,
        accountId:   tx.accountId,
        categoryId:  tx.categoryId ?? null,
        subcategoryId: tx.subcategoryId ?? null,
        destinationAccountId: (tx as any).destinationAccountId ?? null,
      });
    } else {
      this.form.reset({ date: new Date(), type: 'EXPENSE', status: 'COMPLETED' });
      this.subcategories.set([]);
    }
    this.dialogVisible = true;
  }

  save() {
    if (this.form.invalid) return;
    
    const v = this.form.value;
    const type = v.type as string;
    const accountId = v.accountId as string;
    const destinationAccountId = v.destinationAccountId as string;
    const categoryId = v.categoryId as string;

    // Validate transfer-specific requirements
    if (type === 'TRANSFER') {
      if (!destinationAccountId) {
        alert('Selecione a conta de destino para transferências');
        return;
      }
      if (accountId === destinationAccountId) {
        alert('A conta de origem não pode ser igual à conta de destino');
        return;
      }
    } else {
      if (!categoryId) {
        alert('Selecione uma categoria');
        return;
      }
    }

    this.saving.set(true);
    const body: Partial<Transaction> = {
      description: v.description ?? '',
      amount:      v.amount ?? 0,
      date:        v.date ? (v.date as Date).toISOString().split('T')[0] : '',
      type:        type as any,
      status:      v.status as any,
      accountId:   accountId ?? '',
      categoryId:  type === 'TRANSFER' ? undefined : (categoryId ?? undefined),
      subcategoryId: v.subcategoryId ?? undefined,
      destinationAccountId: type === 'TRANSFER' ? destinationAccountId : undefined,
    };
    const op = this.editId()
      ? this.finance.updateTransaction(this.editId()!, body)
      : this.finance.createTransaction(body);
    op.subscribe({
      next: () => { this.dialogVisible = false; this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(tx: Transaction) {
    this.confirm.confirm({
      message: `Excluir "${tx.description}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.finance.deleteTransaction(tx.id).subscribe(() => this.load()),
    });
  }
}
