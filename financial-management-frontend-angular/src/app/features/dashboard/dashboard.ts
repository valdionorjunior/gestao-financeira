import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FinanceService } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import type { DashboardSummary, FinancialInsight, Transaction } from '../../core/models';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { TxTypePipe } from '../../shared/pipes/label.pipes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, TableModule, TagModule, SkeletonModule, ChartModule, TxTypePipe],
  template: `
    <div class="page-container">

      <!-- ── Page Header ─────────────────────────────────── -->
      <div class="page-header">
        <h1>Olá, {{ auth.user()?.firstName ?? 'Usuário' }}!</h1>
        <p style="color: var(--text-color-secondary); font-size: 0.9rem; font-weight: 400; -webkit-text-fill-color: unset; background: none;">
          Aqui está um resumo das suas finanças
        </p>
      </div>

      <!-- ── KPI Cards ─────────────────────────────────────── -->
      @if (loading()) {
        <div class="kpi-grid">
          @for (i of [1,2,3,4]; track i) {
            <p-skeleton height="120px" borderRadius="24px" />
          }
        </div>
      } @else if (summary()) {
        <div class="kpi-grid">

          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-info">
                <div class="kpi-label">Saldo Total</div>
                <div class="kpi-value" [class.success]="summary()!.totalBalance >= 0" [class.danger]="summary()!.totalBalance < 0">
                  {{ summary()!.totalBalance | currency:'BRL':'symbol':'1.2-2' }}
                </div>
              </div>
              <div class="kpi-icon blue"><i class="pi pi-wallet"></i></div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-info">
                <div class="kpi-label">Receitas (mês)</div>
                <div class="kpi-value success">
                  +{{ summary()!.monthlyIncome | currency:'BRL':'symbol':'1.2-2' }}
                </div>
              </div>
              <div class="kpi-icon green"><i class="pi pi-arrow-down" aria-label="Receitas"></i></div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-info">
                <div class="kpi-label">Despesas (mês)</div>
                <div class="kpi-value danger">
                  -{{ summary()!.monthlyExpense | currency:'BRL':'symbol':'1.2-2' }}
                </div>
              </div>
              <div class="kpi-icon red"><i class="pi pi-arrow-up" aria-label="Despesas"></i></div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-info">
                <div class="kpi-label">Economia (mês)</div>
                <div class="kpi-value"
                     [class.success]="(summary()!.monthlyIncome - summary()!.monthlyExpense) >= 0"
                     [class.danger]="(summary()!.monthlyIncome - summary()!.monthlyExpense) < 0">
                  {{ (summary()!.monthlyIncome - summary()!.monthlyExpense) | currency:'BRL':'symbol':'1.2-2' }}
                </div>
              </div>
              <div class="kpi-icon purple"><i class="pi pi-chart-line" aria-label="Economia do mês"></i></div>
            </div>
          </div>

        </div>
      }

      <!-- ── Fluxo de Caixa – Gráfico ──────────────────────── -->
      @if (loadingCF()) {
        <p-skeleton height="320px" borderRadius="1.5rem" />
      } @else if (cashFlowChart()) {
        <div class="card" style="padding: 1.5rem;">
          <div class="section-header" style="margin-bottom: 1rem;">
            <h3>Fluxo de Caixa — Últimos 6 meses</h3>
          </div>
          <p-chart type="line" [data]="cashFlowChart()" [options]="lineOptions" height="280px" />
        </div>
      }

      <!-- ── Main grid ----──────────────────────────────────── -->
      <div class="dashboard-grid">

        <!-- Últimas Transações -->
        <div class="card transactions-card">
          <div class="section-header">
            <h3>Últimas Transações</h3>
            <a routerLink="/transactions" class="view-all">Ver todas <i class="pi pi-arrow-right"></i></a>
          </div>

          @if (loadingTx()) {
            <div style="padding: 1rem 0;">
              @for (i of [1,2,3,4,5]; track i) {
                <p-skeleton height="44px" borderRadius="8px" styleClass="mb-2" />
              }
            </div>
          } @else if (recentTx().length === 0) {
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Nenhuma transação encontrada</p>
            </div>
          } @else {
            <p-table [value]="recentTx()" [rows]="5" styleClass="p-datatable-sm p-datatable-striped">
              <ng-template pTemplate="header">
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th style="text-align:right">Valor</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-tx>
                <tr>
                  <td>{{ tx.date | date:'dd/MM/yyyy' }}</td>
                  <td>{{ tx.description || '—' }}</td>
                  <td>
                    <p-tag
                      [value]="tx.type | txType"
                      [severity]="tx.type === 'INCOME' ? 'success' : tx.type === 'EXPENSE' ? 'danger' : 'info'"
                    />
                  </td>
                  <td style="text-align:right; font-weight: 600;"
                      [class.text-success]="tx.type === 'INCOME'"
                      [class.text-danger]="tx.type === 'EXPENSE'">
                    {{ tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '' }}{{ tx.amount | currency:'BRL':'symbol':'1.2-2' }}
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="4" class="empty-state"><i class="pi pi-inbox"></i> Nenhuma transação</td></tr>
              </ng-template>
            </p-table>
          }
        </div>

        <!-- Insights IA -->
        <div class="card insights-card">
          <div class="section-header">
            <h3><i class="pi pi-sparkles" style="color: var(--primary); margin-right: 0.5rem;"></i>Insights IA</h3>
          </div>

          @if (loadingInsights()) {
            @for (i of [1,2,3]; track i) {
              <p-skeleton height="72px" borderRadius="16px" styleClass="mb-3" />
            }
          } @else if (insights().length === 0) {
            <div class="empty-state">
              <i class="pi pi-sparkles"></i>
              <p>Nenhum insight disponível</p>
            </div>
          } @else {
            <div class="insights-list">
              @for (ins of insights(); track $index) {
                <div class="insight-item" [style.background-color]="insightBg(ins.type)" [style.border-color]="insightBorder(ins.type)">
                  <i [class]="insightIcon(ins.type)" [style.color]="insightColor(ins.type)" [attr.aria-label]="ins.type"></i>
                  <p>{{ ins.message }}</p>
                </div>
              }
            </div>
          }
        </div>

      </div>

      <!-- ── Alertas de Orçamento ───────────────────────────── -->
      @if (budgetAlerts().length > 0) {
        <div class="card" style="padding: 1.5rem;">
          <div class="section-header" style="margin-bottom: 1rem;">
            <h3><i class="pi pi-exclamation-triangle" style="color: var(--warning); margin-right: 0.5rem;"></i>Alertas de Orçamento</h3>
            <a routerLink="/budgets" class="view-all">Ver orçamentos <i class="pi pi-arrow-right"></i></a>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            @for (alert of budgetAlerts(); track alert.id) {
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem;">
                  <span style="font-size: 0.875rem; font-weight: 500; color: var(--text-color);">{{ alert.categoryName ?? alert.categoryId }}</span>
                  <span style="font-size: 0.8rem; font-weight: 600;"
                        [style.color]="alert.percentUsed >= 100 ? 'var(--danger)' : 'var(--warning)'">
                    {{ alert.percentUsed.toFixed(1) }}% utilizado
                  </span>
                </div>
                <div class="budget-bar-bg">
                  <div class="budget-bar-fill"
                       [style.width]="(alert.percentUsed > 100 ? 100 : alert.percentUsed) + '%'"
                       [style.background-color]="alert.percentUsed >= 100 ? 'var(--danger)' : 'var(--warning)'">
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── Previsão de Gastos ─────────────────────────────── -->
      <div class="card" style="padding: 1.5rem;">
        <div class="section-header" style="margin-bottom: 1rem;">
          <h3><i class="pi pi-chart-line" style="color: var(--primary); margin-right: 0.5rem;"></i>Previsão de Gastos</h3>
          <a routerLink="/ai" class="view-all">Ver IA <i class="pi pi-arrow-right"></i></a>
        </div>

        @if (loadingPredict()) {
          <div class="prediction-grid">
            <p-skeleton height="100px" borderRadius="1rem" />
            <p-skeleton height="100px" borderRadius="1rem" />
          </div>
        } @else if (prediction()) {
          <div class="prediction-grid">
            <!-- Destaque: valor previsto -->
            <div class="prediction-highlight">
              <p class="prediction-label">Estimativa para o próximo mês</p>
              <p class="prediction-value">{{ prediction()!.predictedNextMonth | currency:'BRL':'symbol':'1.2-2' }}</p>
            </div>

            <!-- Histórico dos últimos 6 meses -->
            <div class="card" style="padding: 1rem;">
              <p style="font-size: 0.75rem; font-weight: 600; color: var(--text-color-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 0.75rem;">
                Histórico
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                @for (m of prediction()!.history; track m.month) {
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; color: var(--text-color-secondary);">
                      {{ formatPredictMonth(m.month) }}
                    </span>
                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-color);">
                      {{ m.expense | currency:'BRL':'symbol':'1.2-2' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <i class="pi pi-chart-line"></i>
            <p>Dados insuficientes para previsão. Continue registrando suas transações!</p>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    /* ═══ DASHBOARD v2026 — Ultra Violeta + Menta + Coral ═══ */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }

    /* ── Empty State inline ─── */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary, #636E72);
    }
    .empty-state i {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      display: block;
      color: var(--text-muted, #B2BEC3);
    }
    .empty-state p { font-size: 0.9rem; }

    /* ── Insights ─── */
    .insights-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md, 16px);
      border: 1px solid transparent;
      transition: all 0.25s;
    }
    .insight-item:hover {
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(108, 92, 231, 0.06);
    }
    .insight-item i { font-size: 0.9rem; margin-top: 2px; flex-shrink: 0; }
    .insight-item p { font-size: 0.8rem; color: var(--text-primary, #2D3436); line-height: 1.5; }

    .page-header p {
      background: none !important;
      -webkit-text-fill-color: var(--text-secondary, #636E72) !important;
      font-weight: 400;
      margin-top: 0.25rem;
    }

    /* ── Budget bars ─── */
    .budget-bar-bg {
      height: 8px;
      background: var(--surface-border, rgba(108, 92, 231, 0.08));
      border-radius: 99px;
      overflow: hidden;
    }
    .budget-bar-fill {
      height: 8px;
      border-radius: 99px;
      transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    /* ── Prediction ─── */
    .prediction-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .prediction-grid { grid-template-columns: 1fr; }
    }
    .prediction-highlight {
      background: linear-gradient(135deg, rgba(108, 92, 231, 0.08), rgba(0, 212, 170, 0.06));
      border: 1px solid rgba(108, 92, 231, 0.18);
      border-radius: var(--radius-xl, 24px);
      padding: 1.75rem;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-align: center; gap: 0.5rem;
      transition: all 0.3s;
    }
    .prediction-highlight:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md, 0 4px 16px rgba(108, 92, 231, 0.12));
    }
    .prediction-label { font-size: 0.8rem; font-weight: 600; color: var(--primary-500, #6C5CE7); margin: 0; }
    .prediction-value { font-size: 1.75rem; font-weight: 700; color: var(--primary-500, #6C5CE7); margin: 0; }
  `],
})
export class DashboardComponent implements OnInit {
  auth    = inject(AuthService);
  private finance = inject(FinanceService);

  loading         = signal(true);
  loadingTx       = signal(true);
  loadingInsights = signal(true);
  loadingCF       = signal(true);
  loadingPredict  = signal(true);

  summary       = signal<DashboardSummary | null>(null);
  recentTx      = signal<Transaction[]>([]);
  insights      = signal<FinancialInsight[]>([]);
  cashFlowChart = signal<any>(null);
  budgetAlerts  = signal<any[]>([]);
  prediction    = signal<{ history: Array<{ month: string; expense: number }>; predictedNextMonth: number } | null>(null);

  lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            `${ctx.dataset.label}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(128,128,128,0.1)' } },
      y: {
        grid: { color: 'rgba(128,128,128,0.1)' },
        ticks: {
          callback: (v: number) =>
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v),
        },
      },
    },
  };

  ngOnInit() {
    this.finance.getDashboard().subscribe({
      next: s => {
        this.summary.set(s);
        this.loading.set(false);
        if (Array.isArray((s as any)?.budgetAlerts)) {
          this.budgetAlerts.set((s as any).budgetAlerts);
        }
      },
      error: () => this.loading.set(false),
    });
    this.finance.getTransactions({ limit: 5 }).subscribe({
      next: r => { this.recentTx.set(r.data ?? []); this.loadingTx.set(false); },
      error: () => this.loadingTx.set(false),
    });
    this.finance.getInsights().subscribe({
      next: i => { this.insights.set(i ?? []); this.loadingInsights.set(false); },
      error: () => { this.insights.set([]); this.loadingInsights.set(false); },
    });
    const today     = new Date();
    const sixAgo    = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const startDate = `${sixAgo.getFullYear()}-${String(sixAgo.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate   = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    this.finance.getCashFlow({ startDate, endDate }).subscribe({
      next: res => {
        const data     = (res as any)?.cashFlow ?? (Array.isArray(res) ? res : []);
        const labels   = data.map((d: any) => `${String(d.month).padStart(2, '0')}/${String(d.year).slice(2)}`);
        const incomes  = data.map((d: any) => d.income  ?? 0);
        const expenses = data.map((d: any) => d.expense ?? 0);
        this.cashFlowChart.set({
          labels,
          datasets: [
            {
              label: 'Receitas',
              data: incomes,
              borderColor: '#00D4AA',
              backgroundColor: 'rgba(0,212,170,0.12)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
            },
            {
              label: 'Despesas',
              data: expenses,
              borderColor: '#FF6B6B',
              backgroundColor: 'rgba(255,107,107,0.10)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
            },
          ],
        });
        this.loadingCF.set(false);
      },
      error: () => this.loadingCF.set(false),
    });
    this.finance.getPredict().subscribe({
      next: p => { this.prediction.set(p); this.loadingPredict.set(false); },
      error: () => this.loadingPredict.set(false),
    });
  }

  insightIcon(type: string): string {
    const m: Record<string, string> = { WARNING: 'pi pi-exclamation-triangle', TIP: 'pi pi-lightbulb', SUCCESS: 'pi pi-check-circle' };
    return m[type] ?? 'pi pi-info-circle';
  }

  insightColor(type: string): string {
    const m: Record<string, string> = { WARNING: 'var(--warning)', TIP: 'var(--info)', SUCCESS: 'var(--success)' };
    return m[type] ?? 'var(--primary)';
  }

  insightBg(type: string): string {
    const m: Record<string, string> = { WARNING: 'rgba(245,158,11,0.08)', TIP: 'rgba(59,130,246,0.08)', SUCCESS: 'rgba(0,212,170,0.08)' };
    return m[type] ?? 'rgba(108,92,231,0.06)';
  }

  insightBorder(type: string): string {
    const m: Record<string, string> = { WARNING: 'rgba(245,158,11,0.25)', TIP: 'rgba(59,130,246,0.2)', SUCCESS: 'rgba(0,212,170,0.25)' };
    return m[type] ?? 'rgba(108,92,231,0.15)';
  }

  formatPredictMonth(month: string): string {
    const [year, m] = month.split('-');
    const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${names[Number(m) - 1]}/${year.slice(2)}`;
  }
}

