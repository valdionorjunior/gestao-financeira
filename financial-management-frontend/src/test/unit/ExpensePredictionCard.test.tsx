import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpensePredictionCard } from '@components/ExpensePredictionCard';

const fakePrediction = {
  predictedNextMonth: 3200.75,
  history: [
    { month: '2026-01', expense: 2900 },
    { month: '2026-02', expense: 3100 },
    { month: '2026-03', expense: 3200 },
  ],
};

describe('ExpensePredictionCard', () => {
  it('renders skeleton while loading', () => {
    const { container } = render(<ExpensePredictionCard data={null} isLoading={true} />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('renders no-data message when data is null and not loading', () => {
    render(<ExpensePredictionCard data={null} isLoading={false} />);
    expect(screen.getByText(/dados insuficientes|sem previsão|sem dados/i)).toBeInTheDocument();
  });

  it('renders predicted value when data is provided', () => {
    render(<ExpensePredictionCard data={fakePrediction} isLoading={false} />);
    // Formatted BRL value should appear
    expect(screen.getByText(/3\.200,75|3200/)).toBeInTheDocument();
  });

  it('renders the section title', () => {
    render(<ExpensePredictionCard data={fakePrediction} isLoading={false} />);
    expect(screen.getByText(/previsão de gastos/i)).toBeInTheDocument();
  });

  it('formats month labels from history', () => {
    render(<ExpensePredictionCard data={fakePrediction} isLoading={false} />);
    // Jan/26 should appear for 2026-01
    expect(screen.getByText(/Jan\/26/i)).toBeInTheDocument();
  });
});
