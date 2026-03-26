import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell/shell').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transactions').then(m => m.TransactionsComponent),
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/accounts/accounts').then(m => m.AccountsComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories').then(m => m.CategoriesComponent),
      },
      {
        path: 'budgets',
        loadComponent: () => import('./features/budgets/budgets').then(m => m.BudgetsComponent),
      },
      {
        path: 'goals',
        loadComponent: () => import('./features/goals/goals').then(m => m.GoalsComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then(m => m.ReportsComponent),
      },
      {
        path: 'bank-statements',
        loadComponent: () => import('./features/bank-statements/bank-statements').then(m => m.BankStatementsComponent),
      },
      {
        path: 'ai',
        loadComponent: () => import('./features/ai/ai').then(m => m.AiComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
