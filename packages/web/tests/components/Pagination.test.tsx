import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../../src/components/Pagination';

describe('Pagination', () => {
  const defaultProps = {
    page: 1,
    pageSize: 20,
    total: 100,
    onPageChange: vi.fn(),
  };

  it('displays current page and total pages', () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/100 results/)).toBeInTheDocument();
  });

  it('disables prev button on first page', () => {
    render(<Pagination {...defaultProps} page={1} />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} page={5} />);

    expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('calls onPageChange with previous page when prev clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination {...defaultProps} page={3} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /previous/i }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when next clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination {...defaultProps} page={3} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calculates total pages correctly with non-divisible total', () => {
    render(<Pagination {...defaultProps} total={45} />);

    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it('handles single page correctly', () => {
    render(<Pagination {...defaultProps} total={10} />);

    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('has accessible navigation landmark', () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
  });
});
