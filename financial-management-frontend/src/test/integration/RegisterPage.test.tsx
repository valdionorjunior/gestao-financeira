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

const mockRegister = vi.fn();
vi.mock('@stores/auth.store', () => ({
  useAuthStore: () => ({ register: mockRegister }),
}));

import RegisterPage from '@pages/RegisterPage';

/**
 * Helper: select form inputs by position since the RegisterPage labels lack
 * `htmlFor` associations:
 *  container.querySelectorAll('input') gives (order in DOM):
 *  [0] firstName, [1] lastName, [2] email, [3] password, [4] confirmPassword, [5?] lgpdConsent
 */
function getInputs(container: HTMLElement) {
  const all = container.querySelectorAll<HTMLInputElement>('input');
  return {
    firstName:       all[0],
    lastName:        all[1],
    email:           all[2],
    password:        all[3],
    confirmPassword: all[4],
    lgpd:            all[5],
  };
}

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe('RegisterPage – integração', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the page title', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: /criar conta/i })).toBeInTheDocument();
  });

  it('renders at least 5 inputs (firstName, lastName, email, password, confirm)', () => {
    const { container } = renderRegisterPage();
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThanOrEqual(5);
  });

  it('renders a submit button', () => {
    renderRegisterPage();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });

  it('renders a link back to login', () => {
    renderRegisterPage();
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('shows required errors when submitting empty form', async () => {
    renderRegisterPage();
    fireEvent.submit(screen.getByRole('button', { name: /criar conta/i }).closest('form')!);
    await waitFor(() => {
      const errors = screen.getAllByText(/obrigatório/i);
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows min-length error for short password', async () => {
    const { container } = renderRegisterPage();
    const { password } = getInputs(container);
    await userEvent.type(password, '123');
    fireEvent.submit(screen.getByRole('button', { name: /criar conta/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByText(/mínimo/i)).toBeInTheDocument();
    });
  });

  // ── Submission ────────────────────────────────────────────────────────────

  it('calls register() with correct payload on valid submit', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { container } = renderRegisterPage();
    const { firstName, lastName, email, password, confirmPassword, lgpd } = getInputs(container);

    await userEvent.type(firstName,       'João');
    await userEvent.type(lastName,        'Silva');
    await userEvent.type(email,           'joao@example.com');
    await userEvent.type(password,        'Senha@1234');
    await userEvent.type(confirmPassword, 'Senha@1234');
    if (lgpd) await userEvent.click(lgpd);

    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'joao@example.com', firstName: 'João', lastName: 'Silva' }),
      );
    });
  });

  it('navigates to "/" after successful registration', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { container } = renderRegisterPage();
    const { firstName, lastName, email, password, confirmPassword, lgpd } = getInputs(container);

    await userEvent.type(firstName,       'M');
    await userEvent.type(lastName,        'K');
    await userEvent.type(email,           'm@k.com');
    await userEvent.type(password,        'Abc12345!');
    await userEvent.type(confirmPassword, 'Abc12345!');
    if (lgpd) await userEvent.click(lgpd);

    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('does NOT call register when passwords do not match', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { container } = renderRegisterPage();
    const { firstName, lastName, email, password, confirmPassword, lgpd } = getInputs(container);

    await userEvent.type(firstName,       'A');
    await userEvent.type(lastName,        'B');
    await userEvent.type(email,           'a@b.com');
    await userEvent.type(password,        'Abc12345!');
    await userEvent.type(confirmPassword, 'DifferentPass!');
    if (lgpd) await userEvent.click(lgpd);

    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => expect(mockRegister).not.toHaveBeenCalled());
  });
});

