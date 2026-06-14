import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MovieCard } from '../../src/components/MovieCard';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('MovieCard', () => {
  const movie = {
    id: 123,
    title: 'Test Movie',
    releaseYear: 2023,
    voteAverage: 8.5,
  };

  it('renders movie title', () => {
    renderWithRouter(<MovieCard movie={movie} />);

    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('renders release year', () => {
    renderWithRouter(<MovieCard movie={movie} />);

    expect(screen.getByText('2023')).toBeInTheDocument();
  });

  it('renders formatted rating with star', () => {
    renderWithRouter(<MovieCard movie={movie} />);

    expect(screen.getByText(/★.*8\.5/)).toBeInTheDocument();
  });

  it('renders em-dash for null release year', () => {
    renderWithRouter(<MovieCard movie={{ ...movie, releaseYear: null }} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders em-dash for null vote average', () => {
    renderWithRouter(<MovieCard movie={{ ...movie, voteAverage: null }} />);

    expect(screen.getByText(/★.*—/)).toBeInTheDocument();
  });

  it('links to movie detail page', () => {
    renderWithRouter(<MovieCard movie={movie} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/movies/123');
  });

  it('renders optional subtitle when provided', () => {
    renderWithRouter(<MovieCard movie={movie} subtitle="similarity 0.85" />);

    expect(screen.getByText('similarity 0.85')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    renderWithRouter(<MovieCard movie={movie} />);

    expect(screen.queryByText(/similarity/)).not.toBeInTheDocument();
  });

  it('has test id for targeting', () => {
    renderWithRouter(<MovieCard movie={movie} />);

    expect(screen.getByTestId('movie-card')).toBeInTheDocument();
  });
});
