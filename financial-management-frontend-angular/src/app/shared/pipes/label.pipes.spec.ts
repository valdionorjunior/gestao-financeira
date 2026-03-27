import { describe, it, expect } from 'vitest';
import { TxTypePipe, TxStatusPipe, AccountTypePipe, BudgetPeriodPipe, GoalStatusPipe } from './label.pipes';

// ── TxTypePipe ────────────────────────────────────────────────────────────────

describe('TxTypePipe', () => {
  const pipe = new TxTypePipe();

  it('transforms INCOME to "Receita"', () => {
    expect(pipe.transform('INCOME')).toBe('Receita');
  });

  it('transforms EXPENSE to "Despesa"', () => {
    expect(pipe.transform('EXPENSE')).toBe('Despesa');
  });

  it('transforms TRANSFER to "Transferência"', () => {
    expect(pipe.transform('TRANSFER')).toBe('Transferência');
  });

  it('returns original value for unknown type', () => {
    expect(pipe.transform('UNKNOWN')).toBe('UNKNOWN');
  });

  it('handles empty string gracefully', () => {
    expect(pipe.transform('')).toBe('');
  });
});

// ── TxStatusPipe ──────────────────────────────────────────────────────────────

describe('TxStatusPipe', () => {
  const pipe = new TxStatusPipe();

  it('transforms PENDING to "Pendente"', () => {
    expect(pipe.transform('PENDING')).toBe('Pendente');
  });

  it('transforms COMPLETED to "Concluída"', () => {
    expect(pipe.transform('COMPLETED')).toBe('Concluída');
  });

  it('transforms CANCELLED to "Cancelada"', () => {
    expect(pipe.transform('CANCELLED')).toBe('Cancelada');
  });

  it('returns original value for unknown status', () => {
    expect(pipe.transform('IN_REVIEW')).toBe('IN_REVIEW');
  });
});

// ── AccountTypePipe ───────────────────────────────────────────────────────────

describe('AccountTypePipe', () => {
  const pipe = new AccountTypePipe();

  it.each([
    ['CHECKING',       'Conta Corrente'],
    ['SAVINGS',        'Poupança'],
    ['INVESTMENT',     'Investimento'],
    ['CREDIT_CARD',    'Cartão de Crédito'],
    ['CASH',           'Dinheiro'],
    ['DIGITAL_WALLET', 'Carteira Digital'],
  ])('transforms %s to "%s"', (input, expected) => {
    expect(pipe.transform(input)).toBe(expected);
  });

  it('returns original value for unknown account type', () => {
    expect(pipe.transform('CRYPTO')).toBe('CRYPTO');
  });
});

// ── BudgetPeriodPipe ──────────────────────────────────────────────────────────

describe('BudgetPeriodPipe', () => {
  const pipe = new BudgetPeriodPipe();

  it('transforms MONTHLY to "Mensal"', () => {
    expect(pipe.transform('MONTHLY')).toBe('Mensal');
  });

  it('transforms QUARTERLY to "Trimestral"', () => {
    expect(pipe.transform('QUARTERLY')).toBe('Trimestral');
  });

  it('transforms YEARLY to "Anual"', () => {
    expect(pipe.transform('YEARLY')).toBe('Anual');
  });

  it('returns original for unknown period', () => {
    expect(pipe.transform('WEEKLY')).toBe('WEEKLY');
  });
});

// ── GoalStatusPipe ────────────────────────────────────────────────────────────

describe('GoalStatusPipe', () => {
  const pipe = new GoalStatusPipe();

  it('transforms IN_PROGRESS to "Em andamento"', () => {
    expect(pipe.transform('IN_PROGRESS')).toBe('Em andamento');
  });

  it('transforms COMPLETED to "Concluído"', () => {
    expect(pipe.transform('COMPLETED')).toBe('Concluído');
  });

  it('transforms CANCELLED to "Cancelado"', () => {
    expect(pipe.transform('CANCELLED')).toBe('Cancelado');
  });

  it('returns original for unknown status', () => {
    expect(pipe.transform('PAUSED')).toBe('PAUSED');
  });
});
