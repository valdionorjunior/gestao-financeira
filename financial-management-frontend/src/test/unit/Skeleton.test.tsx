import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '@components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default dimensions', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.style.height).toBe('20px');
    expect(el.style.width).toBe('100%');
  });

  it('accepts numeric height', () => {
    const { container } = render(<Skeleton height={48} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe('48px');
  });

  it('accepts string height', () => {
    const { container } = render(<Skeleton height="4rem" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe('4rem');
  });

  it('accepts numeric width', () => {
    const { container } = render(<Skeleton width={200} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
  });

  it('accepts string width', () => {
    const { container } = render(<Skeleton width="50%" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('50%');
  });

  it('applies additional class names', () => {
    const { container } = render(<Skeleton className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('always has animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
