import api from './api';
import type { LoginResponse, User } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  register: async (payload: {
    email: string; password: string; firstName: string; lastName: string; lgpdConsent: boolean;
  }): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  me: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
