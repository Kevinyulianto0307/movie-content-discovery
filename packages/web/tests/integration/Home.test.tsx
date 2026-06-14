import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import { Home } from '../../src/pages/Home';

describe('Home Page Integration', () => {
  it('displays loading skeleton initially', () => {
    render(<Home />);
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders movie list after loading', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('Interstellar')).toBeInTheDocument();
  });

  it('displays movie cards in grid view by default', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const cards = document.querySelectorAll('[class*="card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('switches to table view when list toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const listButton = screen.getByRole('button', { name: /list/i });
    await user.click(listButton);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Release Date')).toBeInTheDocument();
  });

  it('filters movies when searching', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Matrix');

    await waitFor(
      () => {
        expect(screen.getByText('The Matrix')).toBeInTheDocument();
        expect(screen.queryByText('The Dark Knight')).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('shows empty state when no search results', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'NonexistentMovie12345');

    await waitFor(() => {
      expect(screen.getByText(/no movies match/i)).toBeInTheDocument();
    });
  });

  it('displays pagination controls', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('shows search sort options when searching', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox');
    expect(sortSelect).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Dark');

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    // Sort control should still be visible with search-specific options
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('movie cards link to detail page', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const movieLink = screen.getByRole('link', { name: /the dark knight/i });
    expect(movieLink).toHaveAttribute('href', '/movies/1');
  });
});
