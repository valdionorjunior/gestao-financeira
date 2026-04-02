import { Injectable, signal, computed } from '@angular/core';

export type NotificationType = 'budget_alert' | 'goal_deadline' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface BudgetAlert {
  id: string;
  categoryName?: string;
  percentUsed?: number;
  spent?: number;
  limit?: number;
}

export interface GoalNearDue {
  id: string;
  name?: string;
  daysLeft?: number;
  progressPercent?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  loadFromDashboard(budgetAlerts: BudgetAlert[] = [], nearDueGoals: GoalNearDue[] = []): void {
    const notifs: AppNotification[] = [];

    for (const alert of budgetAlerts) {
      const pct = alert.percentUsed ?? 0;
      notifs.push({
        id: `budget-${alert.id}`,
        type: 'budget_alert',
        title: pct >= 100 ? 'Orçamento Esgotado' : 'Alerta de Orçamento',
        message: alert.categoryName
          ? `"${alert.categoryName}" atingiu ${pct.toFixed(0)}% do limite`
          : `Orçamento atingiu ${pct.toFixed(0)}% do limite`,
        read: false,
        createdAt: new Date(),
      });
    }

    for (const goal of nearDueGoals) {
      notifs.push({
        id: `goal-${goal.id}`,
        type: 'goal_deadline',
        title: 'Meta Próxima do Prazo',
        message: goal.name
          ? `"${goal.name}" vence em ${goal.daysLeft ?? '?'} dias (${(goal.progressPercent ?? 0).toFixed(0)}%)`
          : `Meta vence em ${goal.daysLeft ?? '?'} dias`,
        read: false,
        createdAt: new Date(),
      });
    }

    this.notifications.set(notifs);
  }

  markRead(id: string): void {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  clear(): void {
    this.notifications.set([]);
  }
}
