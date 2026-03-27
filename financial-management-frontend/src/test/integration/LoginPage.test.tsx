import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
vi.mock('@stores/auth.store', () => ({
  useAuthStore: () => ({ login: mockLogin }),
}));

import LoginPage from '@pages/LoginPage';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage – integração', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders email and password fields', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText(/seu@email\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/•{6,}/)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /criar conta/i })).toBeInTheDocument();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('shows email validation error when submitting without email', async () => {
    renderLoginPage();
    fireEvent.submit(screen.getByRole('button', { name: /entrar/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByText(/e-mail obrigatório/i)).toBeInTheDocument();
    });
  });

  it('shows password validation error when submitting without password', async () => {
    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/seu@email\.com/i), 'a@b.com');
    fireEvent.submit(screen.getByRole('button', { name: /entrar/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByText(/senha obrigatória/i)).toBeInTheDocument();
    });
  });

  // ── Submission ────────────────────────────────────────────────────────────

  it('calls login() with email and password on valid submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText(/seu@email\.com/i), 'joao@example.com');
    await userEvent.type(screen.getByPlaceholderText(/•{6,}/), 'Senha@123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('joao@example.com', 'Senha@123');
    });
  });

  it('navigates to "/" after successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText(/seu@email\.com/i), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText(/•{6,}/), 'myPass1');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows loading state while submitting', async () => {
    // Never resolves to keep loading state visible
    mockLogin.mockReturnValue(new Promise(() => {}));
    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText(/seu@email\.com/i), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText(/•{6,}/), 'pass1234');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
    });
  });

  it('disables button when loading', async () => {
    mockLogin.mockReturnValue(new Promise(() => {}));
    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText(/seu@email\.com/i), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText(/•{6,}/), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /entrando/i });
      expect(btn).toBeDisabled();
    });
  });

  it('handles login error without crashing', async () => {
    mockLogin.mockRejectedValue({ response: { data: { message: 'Credenciais inválidas' } } });
    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText(/seu@email\.com/i), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText(/•{6,}/), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
  });
});
