import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedLayout } from '@components/ProtectedLayout';
import { useAuthStore } from '@stores/auth.store';

// ── Auth store mock ───────────────────────────────────────────────────────────
vi.mock('@stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// ── Sidebar mock (keeps test focused on layout logic) ────────────────────────
vi.mock('@components/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar" />,
}));

function renderLayout(isAuthenticated: boolean, children = <div>Conteúdo protegido</div>) {
  (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue(isAuthenticated);
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ProtectedLayout>{children}</ProtectedLayout>
    </MemoryRouter>,
  );
}

describe('ProtectedLayout', () => {
  it('renders children when authenticated', () => {
    renderLayout(true);
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });

  it('renders sidebar when authenticated', () => {
    renderLayout(true);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderLayout(false);
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('does not render sidebar when not authenticated', () => {
    renderLayout(false);
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('contains a scrollable main area', () => {
    const { container } = renderLayout(true);
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main?.className).toMatch(/overflow-auto/);
  });
});
