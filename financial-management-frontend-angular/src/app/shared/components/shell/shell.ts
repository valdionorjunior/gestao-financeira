import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { FinanceService } from '../../../core/services/finance.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" [class.sidebar-collapsed]="collapsed()">

      <!-- ── Sidebar ─────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <i class="pi pi-wallet"></i>
          @if (!collapsed()) {
            <span class="brand-text">FinanceApp</span>
          }
          <button class="collapse-btn" (click)="collapsed.set(!collapsed())"
                  [attr.aria-label]="collapsed() ? 'Expandir menu' : 'Recolher menu'">
            <i class="pi" [class.pi-angle-right]="collapsed()" [class.pi-angle-left]="!collapsed()"></i>
          </button>
        </div>

        <nav class="sidebar-nav" aria-label="Navegação principal">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item"
              [attr.title]="item.label"
              [attr.aria-label]="item.label"
            >
              <i [class]="item.icon"></i>
              @if (!collapsed()) {
                <span>{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item logout-btn" (click)="auth.logout()" title="Sair" aria-label="Sair da conta">
            <i class="pi pi-sign-out"></i>
            @if (!collapsed()) { <span>Sair</span> }
          </button>
        </div>
      </aside>

      <!-- ── Main content ─────────────────────────────────── -->
      <div class="main-content">
        <header class="topbar">
          <div class="topbar-right">
            <!-- Dark mode toggle -->
            <button class="topbar-btn" (click)="theme.toggle()"
                    [attr.title]="theme.isDark() ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
                    [attr.aria-label]="theme.isDark() ? 'Modo claro' : 'Modo escuro'">
              <i class="pi" [class.pi-sun]="theme.isDark()" [class.pi-moon]="!theme.isDark()"></i>
            </button>

            <!-- Notification bell -->
            <div class="notif-wrapper">
              <button class="topbar-btn" (click)="toggleNotifPanel()" aria-label="Notificações">
                <i class="pi pi-bell"></i>
                @if (notifSvc.unreadCount() > 0) {
                  <span class="notif-badge">{{ notifSvc.unreadCount() }}</span>
                }
              </button>

              @if (showNotifPanel()) {
                <div class="notif-panel" role="dialog" aria-label="Painel de notificações">
                  <div class="notif-panel-header">
                    <span>Notificações</span>
                    @if (notifSvc.unreadCount() > 0) {
                      <button (click)="notifSvc.markAllRead()">Marcar todas como lidas</button>
                    }
                  </div>

                  @if (notifSvc.notifications().length === 0) {
                    <div class="notif-empty">
                      <i class="pi pi-check-circle"></i>
                      <span>Nenhuma notificação</span>
                    </div>
                  } @else {
                    @for (n of notifSvc.notifications(); track n.id) {
                      <div class="notif-item" [class.unread]="!n.read" (click)="notifSvc.markRead(n.id)">
                        <i class="pi notif-icon"
                           [class.pi-chart-pie]="n.type === 'budget_alert'"
                           [class.pi-flag]="n.type === 'goal_deadline'"
                           [class.pi-info-circle]="n.type === 'info'"
                           [class.budget]="n.type === 'budget_alert'"
                           [class.goal]="n.type === 'goal_deadline'"></i>
                        <div class="notif-text">
                          <strong>{{ n.title }}</strong>
                          <p>{{ n.message }}</p>
                        </div>
                        @if (!n.read) {
                          <span class="notif-dot"></span>
                        }
                      </div>
                    }
                  }
                </div>
              }
            </div>

            <span class="user-greeting">
              Olá, <strong>{{ auth.user()?.firstName ?? 'Usuário' }}</strong>
            </span>
            <div class="avatar" [attr.aria-label]="'Avatar de ' + (auth.user()?.firstName ?? 'U')">
              {{ userInitials() }}
            </div>
          </div>
        </header>

        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: var(--surface-ground, #f8fafc);
    }

    /* ── Sidebar ─────────────────────────────────────────── */
    .sidebar {
      width: var(--sidebar-width, 260px);
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: white;
      display: flex;
      flex-direction: column;
      transition: width var(--transition-base, 250ms ease);
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 100;
      overflow: hidden;
      border-right: 1px solid rgba(139, 92, 246, 0.2);
      box-shadow: var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.16));
    }

    .sidebar-collapsed .sidebar { width: 72px; }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem 1.25rem;
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);
      position: relative;
    }

    .sidebar-header::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
    }

    .sidebar-header .pi-wallet {
      font-size: 1.5rem;
      background: var(--primary-gradient, linear-gradient(135deg, #8B5CF6, #A78BFA));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: float 3s ease-in-out infinite;
    }

    .brand-text {
      font-size: 1.15rem;
      font-weight: 800;
      white-space: nowrap;
      background: var(--primary-gradient, linear-gradient(135deg, #8B5CF6, #A78BFA));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }

    .collapse-btn {
      margin-left: auto;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: var(--radius-md, 16px);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 0.5rem;
      transition: all var(--transition-base, 250ms ease);
    }

    .collapse-btn:hover {
      background: rgba(139, 92, 246, 0.2);
      color: white;
      border-color: rgba(139, 92, 246, 0.5);
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-lg, 24px);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all var(--transition-base, 250ms ease);
      border: 1px solid transparent;
      background: none;
      width: 100%;
      font-size: 0.9rem;
      text-decoration: none;
      white-space: nowrap;
      margin-bottom: 2px;
    }

    .nav-item i {
      font-size: 1.1rem;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-item:hover {
      background: rgba(168, 139, 250, 0.15);
      color: white;
      border-color: rgba(139, 92, 246, 0.3);
    }

    .nav-item.active {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(168, 139, 250, 0.25) 100%);
      color: #c4b5fd;
      font-weight: 600;
      border-color: rgba(139, 92, 246, 0.5);
      box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
    }

    .sidebar-footer {
      padding: 1rem 0.75rem;
      border-top: 1px solid rgba(139, 92, 246, 0.2);
      background: linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.05) 100%);
    }

    .logout-btn {
      color: rgba(255, 255, 255, 0.6) !important;
    }

    .logout-btn:hover {
      color: #fca5a5 !important;
      background: rgba(239, 68, 68, 0.15) !important;
      border-color: rgba(239, 68, 68, 0.3) !important;
    }

    /* ── Main Content ────────────────────────────────────── */
    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width, 260px);
      transition: margin-left var(--transition-base, 250ms ease);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .sidebar-collapsed .main-content { margin-left: 72px; }

    /* ── Topbar ──────────────────────────────────────────── */
    .topbar {
      height: var(--topbar-height, 64px);
      background: var(--surface-card, white);
      border-bottom: 1px solid rgba(139, 92, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.12));
      transition: background var(--transition-base, 250ms ease);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-greeting {
      font-size: 0.9rem;
      color: var(--text-color-secondary, #64748b);
    }

    .user-greeting strong {
      color: var(--text-color, #1e293b);
      font-weight: 700;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-lg, 24px);
      background: var(--primary-gradient, linear-gradient(135deg, #8B5CF6, #A78BFA));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
      box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.12));
      transition: all var(--transition-base, 250ms ease);
      cursor: pointer;
    }

    .avatar:hover {
      transform: scale(1.05);
      box-shadow: var(--shadow-glow, 0 0 20px rgba(139, 92, 246, 0.3));
    }

    /* ── Topbar buttons ──────────────────────────────────── */
    .topbar-btn {
      position: relative;
      width: 38px; height: 38px;
      border-radius: var(--radius-md, 16px);
      background: var(--surface-ground, #f8fafc);
      border: 1px solid rgba(139, 92, 246, 0.15);
      color: var(--text-color-secondary, #64748b);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      transition: all var(--transition-base, 250ms ease);
    }

    .topbar-btn:hover {
      background: rgba(139, 92, 246, 0.1);
      color: var(--primary, #6366f1);
      border-color: rgba(139, 92, 246, 0.3);
      transform: scale(1.05);
    }

    /* ── Notification badge ──────────────────────────────── */
    .notif-badge {
      position: absolute;
      top: -4px; right: -4px;
      min-width: 18px; height: 18px;
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px;
      border: 2px solid var(--surface-card, white);
    }

    /* ── Notification wrapper & panel ───────────────────── */
    .notif-wrapper { position: relative; }

    .notif-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 340px;
      background: var(--surface-card, white);
      border: 1px solid rgba(139, 92, 246, 0.15);
      border-radius: var(--radius-lg, 24px);
      box-shadow: var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.16));
      overflow: hidden;
      z-index: 200;
      animation: slideDown var(--transition-base, 250ms ease) forwards;
    }

    .notif-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(139, 92, 246, 0.1);
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-color, #1e293b);
    }

    .notif-panel-header button {
      background: none;
      border: none;
      color: var(--primary, #6366f1);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md, 16px);
      transition: background var(--transition-fast, 150ms ease);
    }

    .notif-panel-header button:hover { background: rgba(139, 92, 246, 0.1); }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      cursor: pointer;
      border-bottom: 1px solid rgba(139, 92, 246, 0.06);
      transition: background var(--transition-fast, 150ms ease);
      position: relative;
    }

    .notif-item:last-child { border-bottom: none; }

    .notif-item:hover { background: rgba(139, 92, 246, 0.04); }

    .notif-item.unread { background: rgba(139, 92, 246, 0.05); }

    .notif-icon {
      font-size: 1.1rem;
      margin-top: 2px;
      flex-shrink: 0;
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }

    .notif-icon.budget { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
    .notif-icon.goal   { color: #10b981; background: rgba(16, 185, 129, 0.1); }

    .notif-text { flex: 1; min-width: 0; }

    .notif-text strong {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
      margin-bottom: 0.2rem;
    }

    .notif-text p {
      font-size: 0.78rem;
      color: var(--text-color-secondary, #64748b);
      margin: 0;
      white-space: normal;
      line-height: 1.4;
    }

    .notif-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--primary, #6366f1);
      flex-shrink: 0;
      margin-top: 4px;
    }

    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2rem;
      color: var(--text-color-secondary, #64748b);
      font-size: 0.85rem;
    }

    .notif-empty .pi { font-size: 2rem; color: #10b981; }

    .content-area {
      flex: 1;
      padding: 0;
    }

    /* ── Mobile ──────────────────────────────────────────── */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        width: var(--sidebar-width, 260px) !important;
      }
      .layout:not(.sidebar-collapsed) .sidebar {
        transform: translateX(0);
      }
      .sidebar-collapsed .sidebar {
        width: var(--sidebar-width, 260px) !important;
      }
      .main-content { margin-left: 0 !important; }
    }
  `],
})
export class ShellComponent {
  auth     = inject(AuthService);
  theme    = inject(ThemeService);
  notifSvc = inject(NotificationsService);
  private finance = inject(FinanceService);

  collapsed      = signal(false);
  showNotifPanel = signal(false);

  constructor() {
    this.finance.getDashboard().subscribe({
      next: (data) => {
        this.notifSvc.loadFromDashboard(
          data.budgetAlerts ?? [],
          data.goalsSummary?.nearDue ?? [],
        );
      },
      error: () => { /* silent — panel shows empty state */ },
    });
  }

  toggleNotifPanel(): void {
    this.showNotifPanel.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-wrapper')) {
      this.showNotifPanel.set(false);
    }
  }

  navItems: NavItem[] = [
    { label: 'Dashboard',          icon: 'pi pi-th-large',              route: '/dashboard' },
    { label: 'Transações',         icon: 'pi pi-arrow-right-arrow-left', route: '/transactions' },
    { label: 'Contas',             icon: 'pi pi-building-columns',       route: '/accounts' },
    { label: 'Categorias',         icon: 'pi pi-tags',                   route: '/categories' },
    { label: 'Orçamentos',         icon: 'pi pi-chart-pie',              route: '/budgets' },
    { label: 'Metas',              icon: 'pi pi-flag',                   route: '/goals' },
    { label: 'Relatórios',         icon: 'pi pi-chart-bar',              route: '/reports' },
    { label: 'Extratos Bancários', icon: 'pi pi-upload',                 route: '/bank-statements' },
    { label: 'IA & Insights',      icon: 'pi pi-sparkles',               route: '/ai' },
  ];

  userInitials(): string {
    const u = this.auth.user();
    if (!u) return 'U';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  }
}
