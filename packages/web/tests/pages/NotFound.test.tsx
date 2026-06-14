import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from '../../src/pages/NotFound';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('NotFound', () => {
  it('renders page not found message', () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders explanation text', () => {
    renderWithRouter(<NotFound />);

    expect(
      screen.getByText(/doesn't exist or has been moved/),
    ).toBeInTheDocument();
  });

  it('renders link back to browse', () => {
    renderWithRouter(<NotFound />);

    const link = screen.getByRole('link', { name: /back to browse/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
