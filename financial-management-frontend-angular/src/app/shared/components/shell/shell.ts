import { Component, inject, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel';

interface NavItem { label: string; icon: string; route: string; badge?: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, NotificationPanelComponent],
  template: `
  <!-- 🎨 LAYOUT SHELL v2026 — Design System Ultra Violeta -->
  <div class="layout-modern" 
       [class.sidebar-collapsed]="collapsed()" 
       [class.sidebar-mobile-open]="mobileMenuOpen()">

    <!-- 📱 Overlay mobile -->
    @if (mobileMenuOpen() && isMobile()) {
      <div class="mobile-overlay" (click)="closeMobileMenu()"></div>
    }

    <!-- 🌟 Sidebar Ultramoderna -->
    <aside class="sidebar-modern">
      <!-- 💎 Header da marca -->
      <div class="sidebar-header-modern">
        <!-- 🏆 Logo icônico -->
        <div class="brand-logo-modern">
          <div class="logo-circle">
            <i class="pi pi-wallet"></i>
          </div>
          @if (showLabels()) {
            <div class="brand-text-modern">
              <span class="brand-primary">Finance</span>
              <span class="brand-secondary">Pro</span>
            </div>
          }
        </div>
        
        <!-- ⚡ Toggle/Close button -->
        @if (isMobile()) {
          <button class="collapse-btn-modern" (click)="closeMobileMenu()" aria-label="Fechar menu">
            <i class="pi pi-times"></i>
          </button>
        } @else {
          <button 
            class="collapse-btn-modern" 
            (click)="collapsed.set(!collapsed())"
            [attr.aria-label]="collapsed() ? 'Expandir menu' : 'Recolher menu'"
            [class.collapsed]="collapsed()"
          >
            <i class="pi pi-bars"></i>
          </button>
        }
      </div>

      <!-- 🧭 Navegação principal -->
      <nav class="sidebar-nav-modern" aria-label="Navegação principal">
        @for (item of navItems; track item.route; let i = $index) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item-modern"
            [attr.title]="item.label"
            [attr.aria-label]="item.label"
            [style.animation-delay]="(i * 0.05) + 's'"
            (click)="onNavClick()"
          >
            <!-- 🎯 Ícone com background dinâmico -->
            <div class="nav-icon-container">
              <i [class]="item.icon"></i>
              <div class="nav-active-indicator"></div>
            </div>
            
            @if (showLabels()) {
              <span class="nav-label">{{ item.label }}</span>
              <div class="nav-badge" *ngIf="item.badge">
                {{ item.badge }}
              </div>
            }
          </a>
        }
      </nav>

      <!-- 🔓 Footer com logout elegante -->
      <div class="sidebar-footer-modern">
        <div class="user-info-compact" *ngIf="showLabels()">
          <div class="user-avatar">
            {{ userInitials() }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ auth.user()?.firstName ?? 'Usuário' }}</span>
            <span class="user-role">Administrador</span>
          </div>
        </div>
        
        <button 
          class="logout-btn-modern" 
          (click)="auth.logout()" 
          title="Sair" 
          aria-label="Sair da conta"
        >
          <i class="pi pi-sign-out"></i>
                    @if (showLabels()) { <span>Sair</span> }
        </button>
      </div>
    </aside>

    <!-- 🖥️ Área principal de conteúdo -->
    <div class="main-content-modern">
      <!-- ✨ Topbar glassmorphism -->
      <header class="topbar-modern">
        <!-- 🔍 Search global -->
        <div class="topbar-left">
          @if (isMobile()) {
            <button class="mobile-menu-btn" (click)="openMobileMenu()">
              <i class="pi pi-bars"></i>
            </button>
          } @else {
            <div class="search-container">
              <i class="pi pi-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Pesquisar transações, contas..."
                class="search-input"
              >
            </div>
          }
        </div>

        <!-- 🌟 Actions + User -->
        <div class="topbar-right">
          <!-- 🔔 Notificações -->
          <app-notification-panel />
          
          <!-- 🌗 Theme toggle -->
          <button class="topbar-action" (click)="theme.toggle()" [title]="theme.isDark() ? 'Modo claro' : 'Modo escuro'">
            <i [class]="theme.isDark() ? 'pi pi-sun' : 'pi pi-moon'"></i>
          </button>
          
          <!-- 📊 Quick stats -->
          @if (!isMobile()) {
            <div class="topbar-stats">
              <div class="stat-item">
                <span class="stat-value">+R$ 2.450</span>
                <span class="stat-label">Hoje</span>
              </div>
            </div>
          }
          
          <!-- 👤 Avatar dropdown -->
          <div class="user-dropdown">
            <div class="avatar-modern" [attr.aria-label]="'Avatar de ' + userInitials()">
              {{ userInitials() }}
              <div class="status-indicator online"></div>
            </div>
          </div>
        </div>
      </header>

      <!-- 📱 Conteúdo das páginas -->
      <main class="content-area-modern">
        <router-outlet />
      </main>
    </div>

    <!-- 🌈 Background decorativo -->
    <div class="background-decoration">
      <div class="gradient-orb primary"></div>
      <div class="gradient-orb secondary"></div>
      <div class="gradient-orb accent"></div>
    </div>
  </div>
  `,
  styles: [`
    /* 🎨 LAYOUT SHELL v2026 — Design System Ultra Violeta */
    .layout-modern {
      display: flex;
      min-height: 100vh;
      background: var(--surface-ground);
      position: relative;
      overflow-x: hidden;
    }

    /* ✨ Background decorativo */
    .background-decoration {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.1;
      animation: float-orb 20s ease-in-out infinite;
    }

    .gradient-orb.primary {
      width: 400px;
      height: 400px;
      background: var(--gradient-primary);
      top: -200px;
      left: -200px;
      animation-delay: 0s;
    }

    .gradient-orb.secondary {
      width: 300px; 
      height: 300px;
      background: var(--gradient-secondary);
      bottom: -150px;
      right: -150px;
      animation-delay: 7s;
    }

    .gradient-orb.accent {
      width: 250px;
      height: 250px;
      background: var(--gradient-accent);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: 14s;
    }

    @keyframes float-orb {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(30px, -50px) scale(1.1); }
      50% { transform: translate(-20px, -30px) scale(0.9); }
      75% { transform: translate(50px, 20px) scale(1.05); }
    }

    /* 🌟 SIDEBAR ULTRAMODERNA */
    .sidebar-modern {
      width: var(--sidebar-width);
      background: var(--surface-card);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 200;
      transition: all var(--transition-slow);
      box-shadow: 2px 0 32px rgba(108, 92, 231, 0.08);
    }

    .sidebar-collapsed .sidebar-modern {
      width: var(--sidebar-collapsed);
    }

    /* 💎 Header da marca */
    .sidebar-header-modern {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      background: linear-gradient(135deg, var(--surface-card) 0%, rgba(108, 92, 231, 0.02) 100%);
    }

    .brand-logo-modern {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .logo-circle {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-xl);
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
      box-shadow: var(--shadow-md), 0 0 20px rgba(108, 92, 231, 0.2);
      animation: pulse-glow 3s ease-in-out infinite;
    }

    .brand-text-modern {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .brand-primary {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-primary);
      font-family: 'CalSans-SemiBold', 'Inter', sans-serif;
    }

    .brand-secondary {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-500);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .collapse-btn-modern {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--surface-hover);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-base);
    }

    .collapse-btn-modern:hover {
      background: var(--primary-500);
      color: white;
      border-color: var(--primary-500);
      transform: scale(1.05);
    }

    .collapse-btn-modern.collapsed {
      transform: rotate(90deg);
    }

    /* 🧭 Navegação moderna */
    .sidebar-nav-modern {
      flex: 1;
      padding: 1.5rem 1rem;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-item-modern {
      display: flex;
      align-items: center;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-xl);
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition-base);
      margin-bottom: 0.25rem;
      position: relative;
      overflow: hidden;
      animation: slideInLeft 0.4s ease-out both;
    }

    .nav-item-modern::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--gradient-primary);
      opacity: 0;
      transition: opacity var(--transition-base);
      border-radius: var(--radius-xl);
    }

    .nav-icon-container {
      position: relative;
      margin-right: 0.875rem;
      flex-shrink: 0;
    }

    .nav-icon-container i {
      font-size: 1.125rem;
      z-index: 1;
      position: relative;
      transition: all var(--transition-base);
      width: 20px;
      text-align: center;
    }

    .nav-active-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: rgba(108, 92, 231, 0.1);
      transition: all var(--transition-base);
    }

    .nav-label {
      font-weight: 600;
      font-size: 0.875rem;
      z-index: 1;
      position: relative;
      flex: 1;
      transition: all var(--transition-base);
    }

    .nav-badge {
      background: var(--gradient-accent);
      color: white;
      border-radius: var(--radius-full);
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
      z-index: 1;
    }

    /* Estados hover/active */
    .nav-item-modern:hover {
      color: var(--text-primary);
      background: var(--surface-hover);
      transform: translateX(4px);
    }

    .nav-item-modern:hover .nav-active-indicator {
      transform: translate(-50%, -50%) scale(1);
    }

    .nav-item-modern.active {
      color: var(--primary-500);
      background: rgba(108, 92, 231, 0.08);
      font-weight: 700;
      border: 1px solid rgba(108, 92, 231, 0.15);
    }

    .nav-item-modern.active::before {
      opacity: 0.05;
    }

    .nav-item-modern.active .nav-active-indicator {
      transform: translate(-50%, -50%) scale(1);
      background: rgba(108, 92, 231, 0.2);
    }

    .nav-item-modern.active .nav-label {
      color: var(--primary-600);
    }

    /* 🔓 Footer moderno */
    .sidebar-footer-modern {
      padding: 1rem;
      border-top: 1px solid var(--surface-border);
      background: linear-gradient(135deg, rgba(108, 92, 231, 0.02) 0%, var(--surface-card) 100%);
    }

    .user-info-compact {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      margin-bottom: 0.75rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: var(--gradient-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      margin-right: 0.75rem;
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
    }

    .user-name {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.2;
    }

    .logout-btn-modern {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border: none;
      background: var(--surface-hover);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-base);
      font-weight: 600;
      font-size: 0.875rem;
    }

    .logout-btn-modern:hover {
      background: rgba(255, 107, 107, 0.1);
      border-color: rgba(255, 107, 107, 0.2);
      color: var(--accent-600);
    }

    /* 🖥️ ÁREA PRINCIPAL */
    .main-content-modern {
      flex: 1;
      margin-left: var(--sidebar-width);
      transition: margin-left var(--transition-slow);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      position: relative;
      z-index: 1;
    }

    .sidebar-collapsed .main-content-modern {
      margin-left: var(--sidebar-collapsed);
    }

    /* ✨ TOPBAR GLASSMORPHISM */
    .topbar-modern {
      height: var(--topbar-height);
      background: var(--surface-card);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 32px rgba(108, 92, 231, 0.04);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-menu-btn {
      width: 40px;
      height: 40px;
      border: 1px solid var(--surface-border);
      background: var(--surface-hover);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: all var(--transition-base);
      font-size: 1.125rem;
    }

    .mobile-menu-btn:hover {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;
    }

    .search-container {
      position: relative;
      width: 320px;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-xl);
      background: var(--surface-card);
      color: var(--text-primary);
      font-size: 0.875rem;
      transition: all var(--transition-base);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
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

    .topbar-stats {
      display: flex;
      align-items: center;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 0.875rem 1.25rem;
      margin: 0 1rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--secondary-500);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.2;
    }

    .user-dropdown {
      position: relative;
    }

    .avatar-modern {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-xl);
      background: var(--gradient-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all var(--transition-base);
      border: 2px solid white;
      box-shadow: var(--shadow-md);
    }

    .avatar-modern:hover {
      transform: scale(1.05);
      box-shadow: var(--shadow-glow);
    }

    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: var(--radius-full);
      border: 2px solid white;
    }

    .status-indicator.online {
      background: var(--secondary-500);
      animation: pulse-online 2s ease-in-out infinite;
    }

    @keyframes pulse-online {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .content-area-modern {
      flex: 1;
      position: relative;
      z-index: 1;
    }

    /* 📱 MOBILE OVERLAY */
    .mobile-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 199;
      animation: fadeIn 0.2s ease-out;
    }

    /* �️ MONITOR PEQUENO (1025px–1280px) — sidebar colapsa automaticamente */
    @media (max-width: 1280px) {
      .sidebar-modern {
        width: var(--sidebar-collapsed) !important;
      }
      .main-content-modern {
        margin-left: var(--sidebar-collapsed) !important;
      }
    }

    /* 📋 TABLET (769px–1024px) — sidebar colapsa + topbar compacta */
    @media (max-width: 1024px) {
      .sidebar-modern {
        width: var(--sidebar-collapsed) !important;
      }
      .main-content-modern {
        margin-left: var(--sidebar-collapsed) !important;
      }
      .search-container {
        width: 220px;
      }
      .topbar-stats {
        display: none;
      }
      .topbar-modern {
        padding: 0 1.25rem;
      }
    }

    /* 📱 MOBILE (≤768px) — sidebar vira drawer */
    @media (max-width: 768px) {
      .sidebar-modern {
        transform: translateX(-100%);
        width: var(--sidebar-width) !important;
        z-index: 300;
      }
      
      .sidebar-mobile-open .sidebar-modern {
        transform: translateX(0);
      }
      
      .main-content-modern {
        margin-left: 0 !important;
      }
      
      .search-container {
        display: none;
      }
      
      .topbar-modern {
        padding: 0 1rem;
      }

      .content-area-modern {
        padding-bottom: env(safe-area-inset-bottom);
      }
    }

    /* 📱 MOBILE SMALL (≤480px) — reduz tamanho de botões */
    @media (max-width: 480px) {
      .topbar-right {
        gap: 0.5rem;
      }
      
      .topbar-action, .avatar-modern {
        width: 38px;
        height: 38px;
      }
    }

    /* ⚡ ANIMAÇÕES */
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
})
export class ShellComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  collapsed = signal(false);
  mobileMenuOpen = signal(false);
  isMobile = signal(window.innerWidth <= 768);
  isCompact = signal(window.innerWidth <= 1280 && window.innerWidth > 768);

  private resizeHandler = () => {
    const w = window.innerWidth;
    this.isMobile.set(w <= 768);
    this.isCompact.set(w <= 1280 && w > 768);
  };

  /** Sidebar labels should be hidden when auto-collapsed (compact) or manually collapsed on desktop */
  showLabels(): boolean {
    if (this.isMobile()) return true; // mobile drawer always shows labels
    if (this.isCompact()) return false; // tablet/small monitor auto-collapses
    return !this.collapsed(); // desktop respects manual toggle
  }

  ngOnInit(): void {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.closeMobileMenu();
    }
  }

  navItems: NavItem[] = [
    { label: 'Dashboard',          icon: 'pi pi-home',                   route: '/dashboard' },
    { label: 'Transações',         icon: 'pi pi-credit-card',            route: '/transactions', badge: 'Novo' },
    { label: 'Contas',             icon: 'pi pi-wallet',                 route: '/accounts' },
    { label: 'Categorias',         icon: 'pi pi-tags',                   route: '/categories' },
    { label: 'Orçamentos',         icon: 'pi pi-chart-pie',              route: '/budgets' },
    { label: 'Metas',              icon: 'pi pi-flag',                   route: '/goals' },
    { label: 'Relatórios',         icon: 'pi pi-chart-line',             route: '/reports' },
    { label: 'Extratos',           icon: 'pi pi-file-import',            route: '/bank-statements' },
    { label: 'IA & Insights',      icon: 'pi pi-sparkles',               route: '/ai', badge: 'Beta' },
  ];

  userInitials(): string {
    const u = this.auth.user();
    if (!u) return 'U';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  }
}
