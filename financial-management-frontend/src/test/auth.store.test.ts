import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';

// ─── Mock auth service ────────────────────────────────────────────────────────
vi.mock('../app/services/auth.service', () => ({
  authService: {
    login:    vi.fn(),
    register: vi.fn(),
    logout:   vi.fn(),
    me:       vi.fn(),
  },
}));

import { useAuthStore } from '../app/stores/auth.store';
import { authService } from '../app/services/auth.service';

const fakeLoginResp = {
  accessToken:  'access-token-123',
  refreshToken: 'refresh-token-456',
  user: { id: 'u1', email: 'joao@example.com', firstName: 'João', lastName: 'Silva' },
};

beforeEach(() => {
  // Reset the Zustand store to initial state between tests
  useAuthStore.setState({
    user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
  });
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('useAuthStore', () => {
  it('initial state is unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('login() should authenticate user and store tokens', async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue(fakeLoginResp);

    await act(async () => {
      await useAuthStore.getState().login('joao@example.com', 'Senha@123');
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access-token-123');
    expect(state.user?.email).toBe('joao@example.com');
    expect(localStorage.getItem('access_token')).toBe('access-token-123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token-456');
  });

  it('register() should authenticate user after registration', async () => {
    (authService.register as ReturnType<typeof vi.fn>).mockResolvedValue(fakeLoginResp);

    await act(async () => {
      await useAuthStore.getState().register({
        email: 'joao@example.com', password: 'Senha@123',
        firstName: 'João', lastName: 'Silva', lgpdConsent: true,
      });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logout() should clear state and tokens', async () => {
    // Pre-populate state
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'tok', refreshToken: 'ref', user: fakeLoginResp.user as any });
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');

    (authService.logout as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('setTokens() should update accessToken and refreshToken in state', () => {
    act(() => {
      useAuthStore.getState().setTokens('new-access', 'new-refresh');
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
  });

  it('login() should propagate error when auth service throws', async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      act(async () => { await useAuthStore.getState().login('bad@email.com', 'wrong'); }),
    ).rejects.toThrow('Invalid credentials');

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
