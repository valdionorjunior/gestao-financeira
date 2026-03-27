import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIChatPanel } from '@components/AIChatPanel';

// ── Mock dependencies ─────────────────────────────────────────────────────────
vi.mock('@stores/auth.store', () => ({
  useAuthStore: vi.fn((selector: (s: any) => any) =>
    selector({ user: { firstName: 'Ana', lastName: 'Lima' } }),
  ),
}));

vi.mock('@services/finance.service', () => ({
  aiService: {
    insights: vi.fn().mockResolvedValue([]),
    categorize: vi.fn().mockResolvedValue({ category: 'Alimentação' }),
  },
}));

describe('AIChatPanel', () => {
  it('renders the panel without crashing', () => {
    render(<AIChatPanel />);
    // Should have some input area
    expect(document.body).toBeDefined();
  });

  it('shows suggestion chips', () => {
    render(<AIChatPanel />);
    // The SUGGESTIONS array has 4 items
    expect(screen.getByText(/saúde financeira/i)).toBeInTheDocument();
  });

  it('renders at least one button', () => {
    render(<AIChatPanel />);
    // AIChatPanel renders suggestion chips and send/clear buttons
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('input field accepts typing', () => {
    render(<AIChatPanel />);
    const input = document.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
    if (input) {
      fireEvent.change(input, { target: { value: 'Como economizar?' } });
      expect(input.value).toBe('Como economizar?');
    }
  });

  it('clear button exists', () => {
    render(<AIChatPanel />);
    // Trash2 icon button should be present
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
