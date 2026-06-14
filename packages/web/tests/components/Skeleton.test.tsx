import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  MovieCardSkeleton,
  MovieGridSkeleton,
  MovieTableSkeleton,
  MovieDetailSkeleton,
} from '../../src/components/Skeleton';

describe('Skeleton', () => {
  it('renders with aria-hidden for accessibility', () => {
    const { container } = render(<Skeleton width={100} height={20} />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies width and height as pixels when numbers', () => {
    const { container } = render(<Skeleton width={100} height={20} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('100px');
    expect(skeleton.style.height).toBe('20px');
  });

  it('applies width and height as strings when strings', () => {
    const { container } = render(<Skeleton width="50%" height="2rem" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('50%');
    expect(skeleton.style.height).toBe('2rem');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('custom-class');
  });
});

describe('MovieCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<MovieCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('MovieGridSkeleton', () => {
  it('renders default 8 skeletons', () => {
    const { container } = render(<MovieGridSkeleton />);
    // Each MovieCardSkeleton has a wrapper div
    const cards = container.querySelectorAll('[class*="card"]');
    expect(cards.length).toBe(8);
  });

  it('renders custom count of skeletons', () => {
    const { container } = render(<MovieGridSkeleton count={4} />);
    const cards = container.querySelectorAll('[class*="card"]');
    expect(cards.length).toBe(4);
  });
});

describe('MovieTableSkeleton', () => {
  it('renders a table with headers', () => {
    render(<MovieTableSkeleton />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Release Date')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Votes')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders default 10 rows', () => {
    const { container } = render(<MovieTableSkeleton />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(10);
  });

  it('renders custom count of rows', () => {
    const { container } = render(<MovieTableSkeleton count={5} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });
});

describe('MovieDetailSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<MovieDetailSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders multiple skeleton elements', () => {
    const { container } = render(<MovieDetailSkeleton />);
    const skeletons = container.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(3);
  });
});
