import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; lgpdConsent: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,

      setTokens: (access, refresh) => {
        localStorage.setItem('access_token',  access);
        localStorage.setItem('refresh_token', refresh);
        set({ accessToken: access, refreshToken: refresh });
      },

      login: async (email, password) => {
        const data = await authService.login(email, password);
        localStorage.setItem('access_token',  data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
      },

      register: async (payload) => {
        const data = await authService.register(payload);
        localStorage.setItem('access_token',  data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try { await authService.logout(refreshToken); } catch { /* best-effort */ }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name:    'auth-store',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
