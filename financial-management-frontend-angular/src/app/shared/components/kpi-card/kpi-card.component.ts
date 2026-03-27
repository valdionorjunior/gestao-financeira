/**
 * 📊 KPI CARD MODERNO v2026 — Sistema de design ultra violeta
 * Componente base para cartões de métricas financeiras
 * 
 * Design: Glass morphism + gradientes vibrantes + micro-interações
 * Paleta: Ultra violeta (#6C5CE7) + Verde menta (#00D4AA) + Coral (#FF6B6B)
 */
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type KpiType = 'income' | 'expense' | 'transfer' | 'investment' | 'balance' | 'goal';
export type KpiTrendType = 'up' | 'down' | 'neutral';

export interface KpiData {
  title: string;
  value: string | number;
  icon: string;
  type: KpiType;
  change?: string;
  changePercent?: string;
  trend?: KpiTrendType;
  subtitle?: string;
  loading?: boolean;
  clickable?: boolean;
  route?: string;
}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div 
    class="kpi-card"
    [class.kpi-clickable]="data().clickable && data().route"
    [class.kpi-loading]="data().loading"
    [attr.data-type]="data().type"
  >
    <!-- Gradiente superior contextual -->
    <div class="kpi-top-bar" [ngClass]="'kpi-bar-' + data().type"></div>

    <div class="kpi-body">
      <!-- Header: título + ícone -->
      <div class="kpi-head">
        <div class="kpi-titles">
          <h3 class="kpi-title-label">{{ data().title }}</h3>
          @if (data().subtitle) {
            <p class="kpi-subtitle">{{ data().subtitle }}</p>
          }
        </div>
        <div class="kpi-icon-box" [ngClass]="'kpi-icon-' + data().type">
          <i [class]="'pi ' + data().icon"></i>
        </div>
      </div>

      <!-- Valor principal -->
      <div class="kpi-main">
        @if (data().loading) {
          <div class="kpi-skeleton-lg"></div>
          <div class="kpi-skeleton-sm"></div>
        } @else {
          <div class="kpi-amount">{{ formatValue(data().value) }}</div>
          @if (data().change && data().changePercent) {
            <div class="kpi-trend-row">
              <div class="kpi-trend-badge" [ngClass]="'kpi-trend-' + (data().trend || 'neutral')">
                <i [ngClass]="{
                  'pi pi-arrow-up': data().trend === 'up',
                  'pi pi-arrow-down': data().trend === 'down',
                  'pi pi-minus': data().trend === 'neutral' || !data().trend
                }"></i>
                <span>{{ data().changePercent }}</span>
              </div>
              <span class="kpi-trend-label">{{ data().change }}</span>
            </div>
          }
        }
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host { display: block; }

    .kpi-card {
      position: relative;
      background: var(--surface-card, #fff);
      border-radius: var(--radius-xl, 24px);
      padding: 1.75rem;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--surface-border, rgba(108,92,231,0.08));
      transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
      overflow: hidden;
      animation: fadeInUp 0.45s ease-out;
    }
    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-xl);
      border-color: rgba(108,92,231,0.18);
    }
    .kpi-clickable { cursor: pointer; }

    /* Top bar contextual */
    .kpi-top-bar {
      position: absolute; top: 0; left: 0; right: 0; height: 4px;
      border-radius: var(--radius-xl, 24px) var(--radius-xl, 24px) 0 0;
    }
    .kpi-bar-income    { background: linear-gradient(90deg, #00D4AA, #1AFFB1); }
    .kpi-bar-expense   { background: linear-gradient(90deg, #FF6B6B, #FF9999); }
    .kpi-bar-transfer,
    .kpi-bar-balance   { background: linear-gradient(90deg, #6C5CE7, #9A8CFF); }
    .kpi-bar-investment{ background: linear-gradient(90deg, #3B82F6, #60A5FA); }
    .kpi-bar-goal      { background: linear-gradient(90deg, #F59E0B, #FBBF24); }

    .kpi-body { position: relative; z-index: 1; }

    .kpi-head {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;
    }
    .kpi-titles { flex: 1; }
    .kpi-title-label {
      font-size: 0.8rem; font-weight: 600; color: var(--text-secondary, #636E72);
      text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px;
    }
    .kpi-subtitle { font-size: 0.75rem; color: var(--text-muted, #B2BEC3); }

    /* Ícone contextual */
    .kpi-icon-box {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.15rem; flex-shrink: 0;
      transition: transform 0.3s; box-shadow: 0 4px 14px rgba(0,0,0,0.12);
    }
    .kpi-icon-box:hover { transform: scale(1.08) rotate(3deg); }
    .kpi-icon-income     { background: linear-gradient(135deg, #00D4AA, #00B894); }
    .kpi-icon-expense    { background: linear-gradient(135deg, #FF6B6B, #E85555); }
    .kpi-icon-transfer,
    .kpi-icon-balance    { background: linear-gradient(135deg, #6C5CE7, #5B4BD6); }
    .kpi-icon-investment { background: linear-gradient(135deg, #3B82F6, #2563EB); }
    .kpi-icon-goal       { background: linear-gradient(135deg, #F59E0B, #D97706); }

    /* Valor */
    .kpi-amount {
      font-size: 2rem; font-weight: 700; color: var(--text-primary, #2D3436);
      font-variant-numeric: tabular-nums; line-height: 1.1; margin-bottom: 0.5rem;
    }

    /* Trend badge */
    .kpi-trend-row { display: flex; align-items: center; gap: 0.5rem; }
    .kpi-trend-badge {
      display: inline-flex; align-items: center; gap: 0.25rem;
      font-size: 0.8rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px;
    }
    .kpi-trend-badge i { font-size: 0.7rem; }
    .kpi-trend-up      { color: #009B7D; background: rgba(0,212,170,0.12); }
    .kpi-trend-down    { color: #CC4444; background: rgba(255,107,107,0.12); }
    .kpi-trend-neutral { color: #636E72; background: rgba(99,110,114,0.08); }
    .kpi-trend-label   { font-size: 0.8rem; color: var(--text-muted, #B2BEC3); }

    /* Skeleton */
    .kpi-skeleton-lg {
      height: 2.25rem; border-radius: 0.5rem; margin-bottom: 0.5rem;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
    }
    .kpi-skeleton-sm {
      height: 1rem; width: 60%; border-radius: 0.5rem;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  `]
})
export class KpiCardComponent {
  data = input.required<KpiData>();

  /**
   * Formatar valores monetários com precisão brasileira
   */
  formatValue(value: string | number): string {
    if (typeof value === 'string') return value;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }
}