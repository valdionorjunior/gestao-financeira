import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import type { Category } from '../../core/models';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CurrencyPipe, FormsModule,
    ButtonModule, SelectModule,
    SkeletonModule, TabsModule, ChartModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Relatórios</h1>
      </div>

      <p-tabs [value]="0">
        <p-tablist>
          <p-tab [value]="0">Fluxo de Caixa</p-tab>
          <p-tab [value]="1">Despesas por Categoria</p-tab>
          <p-tab [value]="2">Resumo Mensal</p-tab>
          <p-tab [value]="3">Orçamentos</p-tab>
        </p-tablist>

        <p-tabpanels>

          <!-- Cash Flow -->
          <p-tabpanel [value]="0">
            <div style="padding-top:1rem; display:flex; flex-direction:column; gap:1.5rem;">
              <div class="flex items-center gap-3">
                <label class="text-sm text-[var(--text-color-secondary)]">Ano:</label>
                <p-select
                  [options]="years"
                  [(ngModel)]="cashFlowYear"
                  (ngModelChange)="loadCashFlow()"
                  styleClass="min-w-24"
                />
              </div>
              @if (loadingCF()) {
                <p-skeleton height="320px" borderRadius="0.75rem" />
              } @else {
                <div class="card">
                  <p-chart type="bar" [data]="cashFlowChart()" [options]="barOptions" height="300px" />
                </div>
              }
            </div>
          </p-tabpanel>

          <!-- Expenses by Category -->
          <p-tabpanel [value]="1">
            <div style="padding-top:1rem; display:flex; flex-direction:column; gap:1.5rem;">
              <div class="flex items-center gap-3 flex-wrap">
                <p-select [options]="months" optionLabel="label" optionValue="value" [(ngModel)]="expMonth" (ngModelChange)="loadExpenses()" styleClass="min-w-32" placeholder="Mês" />
                <p-select [options]="years" [(ngModel)]="expYear" (ngModelChange)="loadExpenses()" styleClass="min-w-24" />
              </div>
              @if (loadingExp()) {
                <p-skeleton height="320px" borderRadius="0.75rem" />
              } @else {
                <div class="charts-row">
                  <div class="card">
                    <p-chart type="doughnut" [data]="expensesChart()" [options]="pieOptions" height="300px" />
                  </div>
                  <div class="card">
                    <div style="display:flex; flex-direction:column; gap:0.75rem;">
                      @for (item of expenseItems(); track item.categoryId) {
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full" [style.background]="item.color"></span>
                            <span class="text-sm text-[var(--text-color)]">{{ catName(item.categoryId) }}</span>
                          </div>
                          <span class="text-sm font-medium text-[var(--text-color)]">{{ item.total | currency:'BRL':'symbol':'1.2-2' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </p-tabpanel>

          <!-- Monthly Summary -->
          <p-tabpanel [value]="2">
            <div style="padding-top:1rem; display:flex; flex-direction:column; gap:1.5rem;">
              <div class="flex items-center gap-3 flex-wrap">
                <p-select [options]="months" optionLabel="label" optionValue="value" [(ngModel)]="summaryMonth" (ngModelChange)="loadSummary()" styleClass="min-w-32" />
                <p-select [options]="years"  [(ngModel)]="summaryYear"  (ngModelChange)="loadSummary()" styleClass="min-w-24" />
              </div>
              @if (loadingSum()) {
                <div class="grid grid-cols-2 gap-4">
                  @for (i of [1,2,3,4]; track i) { <p-skeleton height="100px" borderRadius="0.75rem" /> }
                </div>
              } @else if (monthlySummary()) {
                <div class="kpi-grid">
                  <div class="kpi-card">
                    <p class="kpi-label">Receitas</p>
                    <p class="kpi-value success">{{ monthlySummary()!.income | currency:'BRL':'symbol':'1.2-2' }}</p>
                  </div>
                  <div class="kpi-card">
                    <p class="kpi-label">Despesas</p>
                    <p class="kpi-value danger">{{ monthlySummary()!.expense | currency:'BRL':'symbol':'1.2-2' }}</p>
                  </div>
                  <div class="kpi-card">
                    <p class="kpi-label">Saldo</p>
                    <p class="kpi-value" [class]="monthlySummary()!.netBalance >= 0 ? 'success' : 'danger'">
                      {{ monthlySummary()!.netBalance | currency:'BRL':'symbol':'1.2-2' }}
                    </p>
                  </div>
                  <div class="kpi-card">
                    <p class="kpi-label">Transações</p>
                    <p class="kpi-value">{{ monthlySummary()!.transactionCount }}</p>
                  </div>
                </div>
              }
            </div>
          </p-tabpanel>

          <!-- Budget Progress -->
          <p-tabpanel [value]="3">
            <div style="padding-top:1rem; display:flex; flex-direction:column; gap:1.5rem;">
              @if (loadingBudgets()) {
                @for (i of [1,2,3,4]; track i) {
                  <p-skeleton height="64px" borderRadius="0.75rem" />
                }
              } @else if (budgetReport().length === 0) {
                <div style="text-align:center; padding:3rem 1rem; color:var(--text-color-secondary);">
                  <i class="pi pi-inbox" style="font-size:2.5rem; display:block; margin-bottom:0.75rem;"></i>
                  <p>Nenhum orçamento encontrado para o período.</p>
                </div>
              } @else {
                <div class="card" style="padding:1.5rem;">
                  <h3 style="margin:0 0 1.25rem; font-size:1rem; font-weight:600; color:var(--text-color);">
                    Orçamentos vs. Gastos
                  </h3>
                  <div style="display:flex; flex-direction:column; gap:1.25rem;">
                    @for (b of budgetReport(); track b.id) {
                      <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.375rem;">
                          <span style="font-size:0.875rem; font-weight:500; color:var(--text-color);">
                            {{ catName(b.categoryId) }}
                          </span>
                          <span style="font-size:0.8rem; font-weight:600;"
                                [style.color]="b.isOverBudget ? 'var(--danger)' : b.alertTriggered ? 'var(--warning)' : 'var(--success)'">
                            {{ b.spentAmount | currency:'BRL':'symbol':'1.2-2' }} /
                            {{ b.amount | currency:'BRL':'symbol':'1.2-2' }}
                            ({{ (b.percentUsed ?? 0).toFixed(1) }}%)
                          </span>
                        </div>
                        <div class="budget-bar-bg">
                          <div class="budget-bar-fill"
                               [style.width]="(b.percentUsed > 100 ? 100 : (b.percentUsed ?? 0)) + '%'"
                               [style.background-color]="b.isOverBudget ? 'var(--danger)' : b.alertTriggered ? 'var(--warning)' : 'var(--success)'">
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </p-tabpanel>

        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styles: [`
    .budget-bar-bg {
      height: 8px;
      background: var(--surface-border, rgba(128,128,128,0.15));
      border-radius: 99px;
      overflow: hidden;
    }
    .budget-bar-fill {
      height: 8px;
      border-radius: 99px;
      transition: width 0.4s ease;
    }
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }
  `],
})
export class ReportsComponent implements OnInit {
  private finance = inject(FinanceService);

  loadingCF      = signal(true);
  loadingExp     = signal(true);
  loadingSum     = signal(true);
  loadingBudgets = signal(true);

  categories    = signal<Category[]>([]);
  cashFlowChart  = signal<any>(null);
  expensesChart  = signal<any>(null);
  expenseItems   = signal<any[]>([]);
  monthlySummary = signal<any>(null);
  budgetReport   = signal<any[]>([]);

  now = new Date();
  cashFlowYear = this.now.getFullYear();
  expYear      = this.now.getFullYear();
  expMonth     = this.now.getMonth() + 1;
  summaryMonth = this.now.getMonth() + 1;
  summaryYear  = this.now.getFullYear();

  years  = Array.from({ length: 6 }, (_, i) => this.now.getFullYear() - i);
  months = [
    { label: 'Janeiro', value: 1 }, { label: 'Fevereiro', value: 2 }, { label: 'Março', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Maio', value: 5 }, { label: 'Junho', value: 6 },
    { label: 'Julho', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Setembro', value: 9 },
    { label: 'Outubro', value: 10 }, { label: 'Novembro', value: 11 }, { label: 'Dezembro', value: 12 },
  ];

  barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { x: { grid: { color: 'rgba(128,128,128,0.1)' } }, y: { grid: { color: 'rgba(128,128,128,0.1)' } } },
  };
  pieOptions = {
    responsive: true,
    plugins: { legend: { position: 'right' } },
  };

  PALETTE = ['#635BFF','#00E5E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#F97316','#06B6D4','#6EE7B7'];

  ngOnInit() {
    this.finance.getCategories().subscribe(c => this.categories.set(c));
    this.loadCashFlow();
    this.loadExpenses();
    this.loadSummary();
    this.loadBudgetReport();
  }

  loadCashFlow() {
    this.loadingCF.set(true);
    const startDate = `${this.cashFlowYear}-01-01`;
    const endDate   = `${this.cashFlowYear}-12-31`;
    this.finance.getCashFlow({ startDate, endDate }).subscribe({
      next: res => {
        const data   = (res as any)?.cashFlow ?? (Array.isArray(res) ? res : []);
        const labels = data.map((d: any) => `${String(d.month).padStart(2,'0')}/${String(d.year).slice(2)}`);
        this.cashFlowChart.set({
          labels,
          datasets: [
            { label: 'Receitas', data: data.map((d: any) => d.income  ?? 0), backgroundColor: '#10B981' },
            { label: 'Despesas', data: data.map((d: any) => d.expense ?? 0), backgroundColor: '#EF4444' },
          ],
        });
        this.loadingCF.set(false);
      },
      error: () => this.loadingCF.set(false),
    });
  }

  loadExpenses() {
    this.loadingExp.set(true);
    this.finance.getMonthlySummary(this.expYear, this.expMonth).subscribe({
      next: data => {
        const raw   = (data?.expenseByCategory ?? []) as Array<{ categoryId: string; total: number }>;
        const items = raw.map((d, i) => ({ ...d, color: this.PALETTE[i % this.PALETTE.length] }));
        this.expenseItems.set(items);
        this.expensesChart.set({
          labels: items.map(d => this.catName(d.categoryId)),
          datasets: [{ data: items.map(d => d.total), backgroundColor: items.map(d => d.color) }],
        });
        this.loadingExp.set(false);
      },
      error: () => this.loadingExp.set(false),
    });
  }

  loadSummary() {
    this.loadingSum.set(true);
    this.finance.getMonthlySummary(this.summaryYear, this.summaryMonth).subscribe({
      next: s => { this.monthlySummary.set(s); this.loadingSum.set(false); },
      error: () => this.loadingSum.set(false),
    });
  }

  loadBudgetReport() {
    this.loadingBudgets.set(true);
    this.finance.getBudgetReport().subscribe({
      next: data => { this.budgetReport.set(data ?? []); this.loadingBudgets.set(false); },
      error: () => { this.budgetReport.set([]); this.loadingBudgets.set(false); },
    });
  }

  catName(id: string) {
    return this.categories().find(c => c.id === id)?.name ?? id?.slice(0, 8) ?? '—';
  }
}
