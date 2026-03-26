import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import type { Budget, Category } from '../../core/models';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { BudgetPeriodPipe } from '../../shared/pipes/label.pipes';

const PERIODS = [
  { label: 'Mensal',      value: 'MONTHLY' },
  { label: 'Trimestral',  value: 'QUARTERLY' },
  { label: 'Anual',       value: 'YEARLY' },
];

@Component({
  selector: 'app-budgets',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CurrencyPipe, DecimalPipe, ReactiveFormsModule,
    ButtonModule, DialogModule, InputTextModule,
    SelectModule, InputNumberModule, ProgressBarModule,
    SkeletonModule, ConfirmDialogModule, TagModule, BudgetPeriodPipe,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Orçamentos</h1>
        <p-button label="Novo Orçamento" icon="pi pi-plus" (onClick)="openDialog()" />
      </div>

      @if (loading()) {
        <div class="cards-grid">
          @for (i of [1,2,3]; track i) { <p-skeleton height="160px" borderRadius="0.75rem" /> }
        </div>
      } @else if (budgets().length === 0) {
        <div class="py-16 text-center">
          <i class="pi pi-calculator text-4xl text-[var(--color-text-muted)] mb-3 block"></i>
          <p class="text-[var(--color-text-muted)]">Nenhum orçamento cadastrado</p>
        </div>
      } @else {
        <div class="cards-grid">
          @for (b of budgets(); track b.id) {
            <div class="card" style="display:flex; flex-direction:column; gap:0.75rem;"
                 [style.border-left]="'4px solid ' + progressColor(pct(b))">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold text-[var(--color-text)]">{{ catName(b.categoryId) }}</p>
                  <p-tag [value]="b.period | budgetPeriod" severity="secondary" styleClass="text-xs mt-1" />
                </div>
                <div class="flex gap-1">
                  <p-button icon="pi pi-pencil" [text]="true" size="small" (onClick)="openDialog(b)" />
                  <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" (onClick)="confirmDelete(b)" />
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
                  <span>{{ b.spent | currency:'BRL':'symbol':'1.2-2' }} gastos</span>
                  <span>{{ b.amount | currency:'BRL':'symbol':'1.2-2' }}</span>
                </div>
                <!-- Barra de progresso: verde→amarelo→vermelho (WCAG: nunca só cor, pct% é o rótulo) -->
                <p-progressbar
                  [value]="pct(b)"
                  [showValue]="false"
                  styleClass="h-2.5"
                  [style]="{'--p-progressbar-value-background': progressColor(pct(b))}"
                />
                <div class="flex items-center gap-1 mt-1">
                  <i class="pi text-xs" [class]="pct(b) >= 100 ? 'pi-exclamation-triangle' : pct(b) >= 70 ? 'pi-exclamation-circle' : 'pi-check-circle'"
                     [style.color]="progressColor(pct(b))" [attr.aria-hidden]="true"></i>
                  <p class="text-xs font-medium" [style.color]="progressColor(pct(b))">
                    {{ pct(b) | number:'1.0-0' }}% utilizado
                    @if (pct(b) >= 100) { <span class="ml-1">(limite atingido)</span> }
                    @else if (pct(b) >= 70) { <span class="ml-1">(atenção)</span> }
                  </p>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editId() ? 'Editar Orçamento' : 'Novo Orçamento'"
      [modal]="true"
      [style]="{width: '420px'}"
    >
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Categoria</label>
          <p-select [options]="categories()" optionLabel="name" optionValue="id" formControlName="categoryId" placeholder="Selecione" styleClass="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Valor limite</label>
          <p-inputnumber formControlName="amount" mode="decimal" [minFractionDigits]="2" placeholder="0,00" styleClass="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Período</label>
          <p-select [options]="periods" optionLabel="label" optionValue="value" formControlName="period" styleClass="w-full" />
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
export class BudgetsComponent implements OnInit {
  private finance = inject(FinanceService);
  private fb      = inject(FormBuilder);
  private confirm = inject(ConfirmationService);

  loading    = signal(true);
  saving     = signal(false);
  budgets    = signal<Budget[]>([]);
  categories = signal<Category[]>([]);
  editId     = signal<string | null>(null);
  dialogVisible = false;

  periods = PERIODS;

  form = this.fb.group({
    categoryId: ['', Validators.required],
    amount:     [null as number | null, Validators.required],
    period:     ['MONTHLY', Validators.required],
  });

  ngOnInit() {
    this.finance.getCategories().subscribe(c => this.categories.set(c));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.finance.getBudgets().subscribe({
      next: b => { this.budgets.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  catName(id: string) {
    return this.categories().find(c => c.id === id)?.name ?? id.slice(0, 8);
  }

  pct(b: Budget) {
    if (!b.amount || b.amount === 0) return 0;
    return Math.min(Math.round((b.spent / b.amount) * 100), 100);
  }

  /** Retorna cor semântica via CSS var — acessível para daltonismo (usa var() do tema) */
  progressColor(pct: number): string {
    if (pct >= 100) return 'var(--color-expense)';   // vermelho: limite atingido
    if (pct >= 70)  return 'var(--color-warning)';   // âmbar: atenção
    return 'var(--color-income)';                    // azul-ciano: saudável
  }

  openDialog(b?: Budget) {
    this.editId.set(b?.id ?? null);
    if (b) {
      this.form.patchValue({ categoryId: b.categoryId, amount: b.amount, period: b.period });
    } else {
      this.form.reset({ period: 'MONTHLY' });
    }
    this.dialogVisible = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value as Partial<Budget>;
    const op = this.editId()
      ? this.finance.updateBudget(this.editId()!, v)
      : this.finance.createBudget(v);
    op.subscribe({
      next: () => { this.dialogVisible = false; this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(b: Budget) {
    this.confirm.confirm({
      message: `Excluir este orçamento?`,
      header: 'Confirmar exclusão',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.finance.deleteBudget(b.id).subscribe(() => this.load()),
    });
  }
}
