import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { render } from '../test-utils';
import { MovieDetail } from '../../src/pages/MovieDetail';

function renderMovieDetail(id: number) {
  return render(
    <Routes>
      <Route path="/movies/:id" element={<MovieDetail />} />
    </Routes>,
    { initialEntries: [`/movies/${id}`] },
  );
}

describe('MovieDetail Page Integration', () => {
  it('displays loading skeleton initially', () => {
    renderMovieDetail(1);
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders movie details after loading', async () => {
    renderMovieDetail(1);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.getByText('(2008)')).toBeInTheDocument();
    expect(screen.getByText('Why So Serious?')).toBeInTheDocument();
    expect(screen.getByText(/Batman raises the stakes/)).toBeInTheDocument();
  });

  it('displays genres', async () => {
    renderMovieDetail(1);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Crime')).toBeInTheDocument();
  });

  it('displays cast members', async () => {
    renderMovieDetail(1);

    await waitFor(() => {
      expect(screen.getByText('Christian Bale')).toBeInTheDocument();
    });

    expect(screen.getByText('Heath Ledger')).toBeInTheDocument();
    expect(screen.getByText('Gary Oldman')).toBeInTheDocument();
    expect(screen.getByText(/Bruce Wayne \/ Batman/)).toBeInTheDocument();
    expect(screen.getByText(/as Joker/)).toBeInTheDocument();
  });

  it('displays director and writers', async () => {
    renderMovieDetail(1);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.getByText(/Director:/)).toBeInTheDocument();
    expect(screen.getByText(/Writer:/)).toBeInTheDocument();
    const nolanMatches = screen.getAllByText(/Christopher Nolan/);
    expect(nolanMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('displays keywords', async () => {
    renderMovieDetail(1);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.getByText('dc comics')).toBeInTheDocument();
    expect(screen.getByText('superhero')).toBeInTheDocument();
  });

  it('displays rating', async () => {
    renderMovieDetail(1);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.getByText(/★ 9.0/)).toBeInTheDocument();
    expect(screen.getByText(/152 min/)).toBeInTheDocument();
  });

  it('displays similar movies', async () => {
    renderMovieDetail(1);

    await waitFor(() => {
      expect(screen.getByText('Similar movies')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Batman Begins')).toBeInTheDocument();
    });

    expect(screen.getByText('The Dark Knight Rises')).toBeInTheDocument();
  });

  it('displays back link to browse', async () => {
    renderMovieDetail(1);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: /back to browse/i });
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('shows error for invalid movie id', () => {
    render(
      <Routes>
        <Route path="/movies/:id" element={<MovieDetail />} />
      </Routes>,
      { initialEntries: ['/movies/invalid'] },
    );

    expect(screen.getByText(/invalid movie id/i)).toBeInTheDocument();
  });

  it('shows error for negative movie id', () => {
    render(
      <Routes>
        <Route path="/movies/:id" element={<MovieDetail />} />
      </Routes>,
      { initialEntries: ['/movies/-5'] },
    );

    expect(screen.getByText(/invalid movie id/i)).toBeInTheDocument();
  });
});
