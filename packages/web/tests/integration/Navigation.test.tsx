import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { render } from '../test-utils';
import { Home } from '../../src/pages/Home';
import { MovieDetail } from '../../src/pages/MovieDetail';
import { NotFound } from '../../src/pages/NotFound';
import { Layout } from '../../src/components/Layout';

function renderApp(initialPath = '/') {
  return render(
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>,
    { initialEntries: [initialPath] },
  );
}

describe('Navigation Integration', () => {
  it('navigates from home to movie detail', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const movieLink = screen.getByRole('link', { name: /the dark knight/i });
    await user.click(movieLink);

    await waitFor(() => {
      expect(screen.getByText('Why So Serious?')).toBeInTheDocument();
    });
  });

  it('navigates back from movie detail to home', async () => {
    const user = userEvent.setup();
    renderApp('/movies/1');

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: /back to browse/i });
    await user.click(backLink);

    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
    });
  });

  it('shows 404 page for unknown routes', () => {
    renderApp('/unknown-route');

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to browse/i })).toBeInTheDocument();
  });

  it('navigates from 404 to home', async () => {
    const user = userEvent.setup();
    renderApp('/unknown-route');

    expect(screen.getByText('Page not found')).toBeInTheDocument();

    const homeLink = screen.getByRole('link', { name: /back to browse/i });
    await user.click(homeLink);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });
  });

  it('navigates to similar movie from detail page', async () => {
    const user = userEvent.setup();
    renderApp('/movies/1');

    await waitFor(() => {
      expect(screen.getByText('Batman Begins')).toBeInTheDocument();
    });

    const similarLink = screen.getByRole('link', { name: /batman begins/i });
    await user.click(similarLink);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to browse/i })).toBeInTheDocument();
    });
  });

  it('renders layout with header on all pages', async () => {
    renderApp('/');

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /movie content discovery/i })).toBeInTheDocument();
  });
});
