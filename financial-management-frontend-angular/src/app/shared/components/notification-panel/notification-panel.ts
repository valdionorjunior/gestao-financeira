import { Component, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  icon: string;
  iconColor: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-wrapper">
      <button class="topbar-action" (click)="toggle($event)" title="Notificações">
        <i class="pi pi-bell"></i>
        @if (unreadCount() > 0) {
          <span class="notification-badge">{{ unreadCount() }}</span>
        }
      </button>

      @if (isOpen()) {
        <div class="notification-panel" (click)="$event.stopPropagation()">
          <div class="panel-header">
            <span class="panel-title">Notificações</span>
            @if (unreadCount() > 0) {
              <button class="mark-all-btn" (click)="markAllRead()">Marcar todas como lidas</button>
            }
          </div>

          <div class="panel-body">
            @for (n of notifications(); track n.id) {
              <div class="notification-item" [class.unread]="!n.read" (click)="markRead(n)">
                <div class="notif-icon" [style.background]="n.iconColor">
                  <i [class]="n.icon"></i>
                </div>
                <div class="notif-content">
                  <span class="notif-title">{{ n.title }}</span>
                  <span class="notif-message">{{ n.message }}</span>
                  <span class="notif-time">{{ n.time }}</span>
                </div>
              </div>
            } @empty {
              <div class="empty-notif">
                <i class="pi pi-check-circle"></i>
                <span>Nenhuma notificação</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-wrapper {
      position: relative;
    }

    .topbar-action {
      position: relative;
      width: 44px;
      height: 44px;
      border: 1px solid var(--surface-border);
      background: var(--surface-hover);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: all var(--transition-base);
      font-size: 1rem;
    }

    .topbar-action:hover {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;
      transform: translateY(-1px);
    }

    .notification-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      background: var(--gradient-accent);
      color: white;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 700;
      border: 2px solid var(--surface-card);
    }

    .notification-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 360px;
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--surface-border);
      z-index: 1000;
      animation: slideDown 0.2s ease-out;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .panel-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .mark-all-btn {
      border: none;
      background: none;
      color: var(--primary-500);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      transition: background var(--transition-fast);
    }

    .mark-all-btn:hover {
      background: rgba(108, 92, 231, 0.08);
    }

    .panel-body {
      max-height: 360px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      cursor: pointer;
      transition: background var(--transition-fast);
      border-bottom: 1px solid var(--surface-border);
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item:hover {
      background: var(--surface-hover);
    }

    .notification-item.unread {
      background: rgba(108, 92, 231, 0.04);
    }

    .notif-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .notif-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .notif-title {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-primary);
    }

    .notif-message {
      font-size: 0.8rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-time {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.125rem;
    }

    .empty-notif {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 0.5rem;
      color: var(--text-muted);
    }

    .empty-notif i {
      font-size: 2rem;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 480px) {
      .notification-panel {
        width: calc(100vw - 2rem);
        right: -1rem;
      }
    }
  `]
})
export class NotificationPanelComponent {
  private el = inject(ElementRef);
  
  isOpen = signal(false);

  notifications = signal<Notification[]>([
    {
      id: 1,
      icon: 'pi pi-exclamation-triangle',
      iconColor: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
      title: 'Orçamento próximo do limite',
      message: 'Alimentação atingiu 85% do limite mensal',
      time: 'Há 2 horas',
      read: false,
    },
    {
      id: 2,
      icon: 'pi pi-arrow-down',
      iconColor: 'linear-gradient(135deg, #00D4AA, #1AFFB1)',
      title: 'Receita registrada',
      message: 'Salário de R$ 5.200,00 creditado',
      time: 'Há 5 horas',
      read: false,
    },
    {
      id: 3,
      icon: 'pi pi-flag',
      iconColor: 'linear-gradient(135deg, #6C5CE7, #9A8CFF)',
      title: 'Meta alcançada!',
      message: 'Reserva de emergência concluída 🎉',
      time: 'Ontem',
      read: true,
    },
  ]);

  unreadCount = signal(0);

  constructor() {
    this.updateUnreadCount();
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  markRead(n: Notification): void {
    n.read = true;
    this.notifications.update(list => [...list]);
    this.updateUnreadCount();
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.updateUnreadCount();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isOpen() && !this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  private updateUnreadCount(): void {
    this.unreadCount.set(this.notifications().filter(n => !n.read).length);
  }
}
