import { Pipe, PipeTransform } from '@angular/core';

const TX_TYPE: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  TRANSFER: 'Transferência',
};
const TX_STATUS: Record<string, string> = {
  PENDING:   'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELED:  'Cancelada',
};
const ACCOUNT_TYPE: Record<string, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  INVESTMENT: 'Investimento',
  CREDIT_CARD: 'Cartão de Crédito',
  CASH: 'Dinheiro',
  DIGITAL_WALLET: 'Carteira Digital',
};
const BUDGET_PERIOD: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
};
const GOAL_STATUS: Record<string, string> = {
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

@Pipe({ name: 'txType', standalone: true })
export class TxTypePipe implements PipeTransform {
  transform(v: string): string { return TX_TYPE[v] ?? v; }
}

@Pipe({ name: 'txStatus', standalone: true })
export class TxStatusPipe implements PipeTransform {
  transform(v: string): string { return TX_STATUS[v] ?? v; }
}

@Pipe({ name: 'accountType', standalone: true })
export class AccountTypePipe implements PipeTransform {
  transform(v: string): string { return ACCOUNT_TYPE[v] ?? v; }
}

@Pipe({ name: 'budgetPeriod', standalone: true })
export class BudgetPeriodPipe implements PipeTransform {
  transform(v: string): string { return BUDGET_PERIOD[v] ?? v; }
}

@Pipe({ name: 'goalStatus', standalone: true })
export class GoalStatusPipe implements PipeTransform {
  transform(v: string): string { return GOAL_STATUS[v] ?? v; }
}
