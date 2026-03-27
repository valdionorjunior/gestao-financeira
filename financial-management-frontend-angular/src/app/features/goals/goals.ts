import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import type { Goal } from '../../core/models';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { GoalStatusPipe } from '../../shared/pipes/label.pipes';

@Component({
  selector: 'app-goals',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule, InputNumberModule,
    DatePickerModule, ProgressBarModule, SkeletonModule,
    ConfirmDialogModule, TagModule, GoalStatusPipe,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Metas Financeiras</h1>
          <p class="page-subtitle">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <p-button label="Nova Meta" icon="pi pi-plus" (onClick)="openDialog()" />
      </div>

      @if (loading()) {
        <div class="cards-grid">
          @for (i of [1,2,3]; track i) { <p-skeleton height="220px" borderRadius="1.25rem" /> }
        </div>
      } @else if (goals().length === 0) {
        <div class="empty-hero">
          <div class="empty-icon-circle">
            <i class="pi pi-flag"></i>
          </div>
          <p class="empty-title">Nenhuma meta cadastrada</p>
          <p class="empty-desc">Defina metas financeiras e acompanhe seu progresso</p>
          <p-button label="Criar meta" icon="pi pi-plus" (onClick)="openDialog()" />
        </div>
      } @else {
        <div class="cards-grid">
          @for (g of goals(); track g.id) {
            <div class="card goal-card">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold text-[var(--text-primary)]">{{ g.name }}</p>
                  @if (g.deadline) {
                    <p class="text-xs text-[var(--text-secondary)] mt-0.5">
                      <i class="pi pi-calendar mr-1"></i>{{ g.deadline | date:'dd/MM/yyyy' }}
                    </p>
                  }
                </div>
                <p-tag
                  [value]="g.status | goalStatus"
                  [severity]="g.status === 'COMPLETED' ? 'success' : g.status === 'IN_PROGRESS' ? 'info' : 'secondary'"
                />
              </div>

              <!-- Progress -->
              <div>
                <div class="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                  <span>{{ g.currentAmount | currency:'BRL':'symbol':'1.2-2' }}</span>
                  <span>{{ g.targetAmount | currency:'BRL':'symbol':'1.2-2' }}</span>
                </div>
                <p-progressbar [value]="pct(g)" [showValue]="false" styleClass="h-2" />
                <p class="text-xs mt-1 font-medium" style="color: var(--primary-500);">{{ pct(g) | number:'1.0-0' }}% atingido</p>
              </div>

              <div class="flex gap-2">
                <p-button label="Contribuir" icon="pi pi-plus-circle" [text]="true" size="small" class="flex-1" (onClick)="openContrib(g)" />
                <p-button icon="pi pi-pencil" [text]="true" size="small" (onClick)="openDialog(g)" />
                <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" (onClick)="confirmDelete(g)" />
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Goal Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editId() ? 'Editar Meta' : 'Nova Meta'"
      [modal]="true"
      [style]="{width: '420px'}"
    >
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Nome</label>
          <input pInputText formControlName="name" placeholder="Ex: Fundo de emergência" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Valor alvo</label>
          <p-inputnumber formControlName="targetAmount" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Prazo (opcional)</label>
          <p-datepicker formControlName="deadline" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Descrição (opcional)</label>
          <input pInputText formControlName="description" placeholder="Detalhes da meta" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancelar" [text]="true" (onClick)="dialogVisible = false" />
          <p-button type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>

    <!-- Contribution Dialog -->
    <p-dialog [(visible)]="contribVisible" header="Adicionar Contribuição" [modal]="true" [style]="{width: '360px'}">
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Valor</label>
          <p-inputnumber [(ngModel)]="contribAmount" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancelar" [text]="true" (onClick)="contribVisible = false" />
          <p-button label="Confirmar" [loading]="saving()" [disabled]="!contribAmount" (onClick)="saveContrib()" />
        </div>
      </div>
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
    .goal-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .goal-card { padding: 1.25rem; }
    }
  `],
})
export class GoalsComponent implements OnInit {
  private finance = inject(FinanceService);
  private fb      = inject(FormBuilder);
  private confirm = inject(ConfirmationService);

  loading       = signal(true);
  saving        = signal(false);
  goals         = signal<Goal[]>([]);
  editId        = signal<string | null>(null);
  contribGoalId = signal<string | null>(null);
  dialogVisible  = false;
  contribVisible = false;
  contribAmount  = 0;

  form = this.fb.group({
    name:         ['', Validators.required],
    targetAmount: [null as number | null, Validators.required],
    deadline:     [null as Date | null],
    description:  [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.finance.getGoals().subscribe({
      next: g => { this.goals.set(g); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  pct(g: Goal) {
    if (!g.targetAmount) return 0;
    return Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);
  }

  openDialog(g?: Goal) {
    this.editId.set(g?.id ?? null);
    if (g) {
      this.form.patchValue({
        name: g.name,
        targetAmount: g.targetAmount,
        deadline: g.deadline ? new Date(g.deadline) : null,
        description: g.description ?? '',
      });
    } else {
      this.form.reset();
    }
    this.dialogVisible = true;
  }

  openContrib(g: Goal) {
    this.contribGoalId.set(g.id);
    this.contribAmount = 0;
    this.contribVisible = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;
    const body: Partial<Goal> = {
      name: v.name ?? '',
      targetAmount: v.targetAmount ?? 0,
      deadline: v.deadline ? (v.deadline as Date).toISOString().split('T')[0] : undefined,
      description: v.description ?? undefined,
    };
    const op = this.editId()
      ? this.finance.updateGoal(this.editId()!, body)
      : this.finance.createGoal(body);
    op.subscribe({
      next: () => { this.dialogVisible = false; this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  saveContrib() {
    if (!this.contribGoalId() || !this.contribAmount) return;
    this.saving.set(true);
    this.finance.addContribution(this.contribGoalId()!, this.contribAmount).subscribe({
      next: () => { this.contribVisible = false; this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(g: Goal) {
    this.confirm.confirm({
      message: `Excluir meta "${g.name}"?`,
      header: 'Confirmar exclusão',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.finance.deleteGoal(g.id).subscribe(() => this.load()),
    });
  }
}
