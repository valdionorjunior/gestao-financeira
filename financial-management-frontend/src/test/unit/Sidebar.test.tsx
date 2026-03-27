import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@components/Sidebar';
import { useAuthStore } from '@stores/auth.store';

// ── Auth store mock ───────────────────────────────────────────────────────────
vi.mock('@stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

const mockLogout = vi.fn();

function renderSidebar(collapsed = false, pathname = '/') {
  (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
    user:   { firstName: 'João', lastName: 'Silva' },
    logout: mockLogout,
  });

  const onToggle = vi.fn();

  return {
    onToggle,
    ...render(
      <MemoryRouter initialEntries={[pathname]}>
        <Sidebar collapsed={collapsed} onToggle={onToggle} />
      </MemoryRouter>,
    ),
  };
}

describe('Sidebar', () => {
  beforeEach(() => {
    mockLogout.mockReset();
  });

  it('renders the app logo when expanded', () => {
    renderSidebar(false);
    expect(screen.getByText(/FinanceApp/i)).toBeInTheDocument();
  });

  it('hides the app logo when collapsed', () => {
    renderSidebar(true);
    expect(screen.queryByText(/FinanceApp/i)).not.toBeInTheDocument();
  });

  it('shows all navigation labels when expanded', () => {
    renderSidebar(false);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transações')).toBeInTheDocument();
    expect(screen.getByText('Contas')).toBeInTheDocument();
    expect(screen.getByText('Orçamentos')).toBeInTheDocument();
    expect(screen.getByText('Metas')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
  });

  it('hides navigation labels when collapsed', () => {
    renderSidebar(true);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Transações')).not.toBeInTheDocument();
  });

  it('calls onToggle when the toggle button is clicked', () => {
    const { onToggle } = renderSidebar(false);
    fireEvent.click(screen.getByLabelText(/toggle sidebar/i));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('displays user name when expanded', () => {
    renderSidebar(false);
    expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', async () => {
    renderSidebar(false);
    fireEvent.click(screen.getByText('Sair'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('highlights the active navigation item', () => {
    renderSidebar(false, '/transactions');
    const transLink = screen.getByText('Transações').closest('a');
    expect(transLink?.className).toMatch(/bg-gradient/);
  });

  it('rotates chevron icon when collapsed', () => {
    const { container } = renderSidebar(true);
    const chevron = container.querySelector('.rotate-180');
    expect(chevron).toBeInTheDocument();
  });
});
