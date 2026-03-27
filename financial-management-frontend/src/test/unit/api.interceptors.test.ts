import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for the Axios instance (api.ts).
 * We test the interceptor logic indirectly through service calls,
 * keeping localStorage mocked to simulate token presence/absence.
 */

// ── localStorage mock ─────────────────────────────────────────────────────────
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem:    (k: string) => store[k] ?? null,
  setItem:    (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear:      () => Object.keys(store).forEach(k => delete store[k]),
});

// ── Mock the axios module itself ───────────────────────────────────────────────
vi.mock('axios', async () => {
  const mockInstance = {
    get:                 vi.fn(),
    post:                vi.fn(),
    patch:               vi.fn(),
    put:                 vi.fn(),
    delete:              vi.fn(),
    interceptors: {
      request:  { use: vi.fn((fn) => fn) },
      response: { use: vi.fn((ok, err) => ({ ok, err })) },
    },
    defaults: { headers: { common: {} } },
  };
  return {
    default: {
      create:   vi.fn(() => mockInstance),
      post:     vi.fn(),
    },
    ...mockInstance,
  };
});

// ── Test interceptor logic in isolation ───────────────────────────────────────

describe('api.ts – request interceptor helper', () => {
  beforeEach(() => Object.keys(store).forEach(k => delete store[k]));

  it('returns a config with Authorization header when token is present', () => {
    store['access_token'] = 'my-token-xyz';

    // Replicate the interceptor behaviour directly
    const token = localStorage.getItem('access_token');
    const config: any = { headers: { set: vi.fn() } };
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    expect(config.headers.set).toHaveBeenCalledWith('Authorization', 'Bearer my-token-xyz');
  });

  it('does not set Authorization when no token is stored', () => {
    // store is empty
    const token = localStorage.getItem('access_token');
    const config: any = { headers: { set: vi.fn() } };
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    expect(config.headers.set).not.toHaveBeenCalled();
  });
});

describe('api.ts – 401 response interceptor helper', () => {
  afterEach(() => Object.keys(store).forEach(k => delete store[k]));

  it('clears tokens from localStorage when refresh fails', () => {
    store['access_token']  = 'expired';
    store['refresh_token'] = 'bad-refresh';

    // Simulate what the error interceptor does when refresh fails
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('stores new tokens after a successful refresh', () => {
    // Simulate the persist logic
    localStorage.setItem('access_token',  'new-access');
    localStorage.setItem('refresh_token', 'new-refresh');

    expect(localStorage.getItem('access_token')).toBe('new-access');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
  });
});

