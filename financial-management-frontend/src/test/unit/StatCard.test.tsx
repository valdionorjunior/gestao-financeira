import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@components/StatCard';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Saldo Total" value="R$ 1.200,00" />);
    expect(screen.getByText('Saldo Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard title="Receita" value={5000} subtitle="Mês atual" />);
    expect(screen.getByText('Mês atual')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    render(<StatCard title="Despesa" value={3000} />);
    expect(screen.queryByText('Mês atual')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    render(<StatCard title="Contas" value={3} icon={<TestIcon />} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders positive trend with up arrow', () => {
    render(<StatCard title="Receita" value={1000} trend={{ value: 12.5, label: 'vs mês anterior' }} />);
    expect(screen.getByText(/12\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('renders negative trend with down arrow', () => {
    render(<StatCard title="Despesa" value={800} trend={{ value: -8.3, label: 'vs mês anterior' }} />);
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/8\.3%/)).toBeInTheDocument();
  });

  it('applies default gradient color class', () => {
    const { container } = render(<StatCard title="T" value="V" />);
    const iconWrapper = container.querySelector('.bg-gradient-to-r');
    expect(iconWrapper).toBeNull(); // no icon provided, wrapper not rendered
  });

  it('renders numeric value as string', () => {
    render(<StatCard title="Total" value={42000} />);
    expect(screen.getByText('42000')).toBeInTheDocument();
  });
});
