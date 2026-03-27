import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Global browser API stubs needed by jsdom ─────────────────────────────────

// ResizeObserver – required by recharts and some UI libs
global.ResizeObserver = class ResizeObserver {
  observe()    { /* noop */ }
  unobserve()  { /* noop */ }
  disconnect() { /* noop */ }
};

// matchMedia – not provided by jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches:              false,
    media:                query,
    onchange:             null,
    addListener:          vi.fn(),
    removeListener:       vi.fn(),
    addEventListener:     vi.fn(),
    removeEventListener:  vi.fn(),
    dispatchEvent:        vi.fn(),
  })),
});

// scrollTo – jsdom stub
window.scrollTo = vi.fn() as typeof window.scrollTo;

// react-hot-toast – render inside jsdom without portal errors
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error:   vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
  toast:   { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));
