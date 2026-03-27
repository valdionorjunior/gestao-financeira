/**
 * 🎯 EMPTY STATE MODERNO v2026 — Feedback visual elegante 
 * Componente universal para estados vazios com call-to-action
 * 
 * Design: Illustrations soft + micro-interações + gradientes suaves
 * Uso: Listas vazias, filtros sem resultado, primeira experiência
 */
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type EmptyStateType = 'transactions' | 'accounts' | 'budgets' | 'goals' | 'search' | 'error' | 'generic';

export interface EmptyStateData {
  type: EmptyStateType;
  title: string;
  description: string;
  illustration?: string;
  primaryAction?: {
    label: string;
    icon?: string;
    route?: string;
    action?: string;
  };
  secondaryAction?: {
    label: string;
    icon?: string;
    route?: string;
    action?: string;
  };
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="empty-container">
    <!-- Ilustração contextual -->
    <div class="empty-illustration">
      <div class="empty-glow" [ngClass]="'glow-' + data().type"></div>
      <div class="empty-circle" [ngClass]="'circle-' + data().type">
        <i [class]="getIcon()"></i>
      </div>
    </div>

    <div class="empty-text">
      <h3 class="empty-title">{{ data().title }}</h3>
      <p class="empty-description">{{ data().description }}</p>
    </div>

    <div class="empty-actions">
      @if (data().primaryAction) {
        @if (data().primaryAction!.route) {
          <a [routerLink]="data().primaryAction!.route" class="btn-primary-modern">
            @if (data().primaryAction!.icon) {
              <i [class]="'pi ' + data().primaryAction!.icon"></i>
            }
            <span>{{ data().primaryAction!.label }}</span>
          </a>
        } @else {
          <button (click)="onAction(data().primaryAction!.action!)" class="btn-primary-modern">
            @if (data().primaryAction!.icon) {
              <i [class]="'pi ' + data().primaryAction!.icon"></i>
            }
            <span>{{ data().primaryAction!.label }}</span>
          </button>
        }
      }

      @if (data().secondaryAction) {
        @if (data().secondaryAction!.route) {
          <a [routerLink]="data().secondaryAction!.route" class="btn-secondary-modern">
            @if (data().secondaryAction!.icon) {
              <i [class]="'pi ' + data().secondaryAction!.icon"></i>
            }
            <span>{{ data().secondaryAction!.label }}</span>
          </a>
        } @else {
          <button (click)="onAction(data().secondaryAction!.action!)" class="btn-secondary-modern">
            @if (data().secondaryAction!.icon) {
              <i [class]="'pi ' + data().secondaryAction!.icon"></i>
            }
            <span>{{ data().secondaryAction!.label }}</span>
          </button>
        }
      }
    </div>
  </div>
  `,
  styles: [`
    :host { display: block; animation: fadeInUp 0.6s ease-out; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes float-gentle {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }

    .empty-container {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 4rem 1.5rem; text-align: center;
    }

    /* Ilustração / ícone */
    .empty-illustration { position: relative; margin-bottom: 2rem; animation: float-gentle 6s ease-in-out infinite; }
    .empty-glow {
      position: absolute; inset: 0; border-radius: 50%;
      filter: blur(40px); opacity: 0.2; transform: scale(1.3);
    }
    .glow-transactions { background: #00D4AA; }
    .glow-accounts     { background: #6C5CE7; }
    .glow-budgets, .glow-goals { background: #F59E0B; }
    .glow-search       { background: #3B82F6; }
    .glow-error        { background: #FF6B6B; }
    .glow-generic      { background: #9CA3AF; }

    .empty-circle {
      position: relative; width: 96px; height: 96px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2.25rem; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .circle-transactions { background: linear-gradient(135deg, #00D4AA, #00B894); }
    .circle-accounts     { background: linear-gradient(135deg, #6C5CE7, #5B4BD6); }
    .circle-budgets, .circle-goals { background: linear-gradient(135deg, #F59E0B, #D97706); }
    .circle-search       { background: linear-gradient(135deg, #3B82F6, #2563EB); }
    .circle-error        { background: linear-gradient(135deg, #FF6B6B, #E85555); }
    .circle-generic      { background: linear-gradient(135deg, #9CA3AF, #6B7280); }

    /* Texto */
    .empty-text { max-width: 400px; margin-bottom: 2rem; }
    .empty-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary, #2D3436); margin-bottom: 0.75rem; }
    .empty-description { font-size: 1rem; color: var(--text-secondary, #636E72); line-height: 1.6; }

    /* Ações */
    .empty-actions { display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 280px; }
    @media (min-width: 480px) { .empty-actions { flex-direction: row; max-width: 420px; } }

    .btn-primary-modern {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600;
      color: #fff; background: linear-gradient(135deg, #6C5CE7, #5B4BD6);
      box-shadow: 0 4px 14px rgba(108, 92, 231, 0.25);
      border: none; cursor: pointer; text-decoration: none; transition: all 0.3s;
    }
    .btn-primary-modern:hover { box-shadow: 0 8px 20px rgba(108,92,231,0.4); transform: scale(1.05); }
    .btn-primary-modern:active { transform: scale(0.95); }

    .btn-secondary-modern {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600;
      background: #fff; color: #2D3436; border: 2px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: pointer; text-decoration: none; transition: all 0.3s;
    }
    .btn-secondary-modern:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: scale(1.05); }
    .btn-secondary-modern:active { transform: scale(0.95); }
  `]
})
export class EmptyStateComponent {
  data = input.required<EmptyStateData>();
  actionClicked = output<string>();
  
  getIcon(): string {
    const icons: Record<EmptyStateType, string> = {
      'transactions': 'pi-wallet',
      'accounts': 'pi-credit-card', 
      'budgets': 'pi-chart-pie',
      'goals': 'pi-flag',
      'search': 'pi-search',
      'error': 'pi-exclamation-triangle',
      'generic': 'pi-inbox'
    };
    
    return icons[this.data().type] || 'pi-inbox';
  }
  
  onAction(action: string): void {
    this.actionClicked.emit(action);
  }
}