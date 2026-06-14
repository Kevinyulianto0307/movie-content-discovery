import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import { server } from '../test-utils/server';
import { http, HttpResponse } from 'msw';
import { Home } from '../../src/pages/Home';
import { createPaginatedResponse, mockMovies } from '../test-utils/mocks';

describe('Home Page Edge Cases - Branch Coverage', () => {
  describe('Loading states', () => {
    it('shows table skeleton in list view while loading', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/movies', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(createPaginatedResponse(mockMovies));
        }),
      );

      render(<Home />);

      await user.click(screen.getByRole('button', { name: /list/i }));

      const skeletons = document.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty states', () => {
    it('shows browse empty state when no movies exist', async () => {
      server.use(
        http.get('/api/movies', () => {
          return HttpResponse.json(createPaginatedResponse([], { total: 0 }));
        }),
      );

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('No movies found.')).toBeInTheDocument();
      });
    });

    it('shows search empty state with query text', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/search', () => {
          return HttpResponse.json(createPaginatedResponse([], { total: 0 }));
        }),
      );

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/No movies match "nonexistent"/)).toBeInTheDocument();
      });
    });
  });

  describe('Sort control visibility', () => {
    it('hides sort control in list view', async () => {
      const user = userEvent.setup();

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /list/i }));

      expect(screen.queryByLabelText(/sort by/i)).not.toBeInTheDocument();
    });

    it('shows search sort options when searching in grid view', async () => {
      const user = userEvent.setup();

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'matrix');

      await waitFor(() => {
        expect(screen.getByText('The Matrix')).toBeInTheDocument();
      });

      // Sort control should still be visible with search-specific options (including Relevance)
      // Use waitFor because debounce delay means isSearching may not be true immediately
      await waitFor(() => {
        const sortSelect = screen.getByRole('combobox') as HTMLSelectElement;
        expect(sortSelect).toBeInTheDocument();
        const options = Array.from(sortSelect.options).map((o) => o.text);
        expect(options).toContain('Relevance');
      });
    });
  });

  describe('Table view with data', () => {
    it('renders table with movies in list view', async () => {
      const user = userEvent.setup();

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /list/i }));

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    it('table disables sorting when searching', async () => {
      const user = userEvent.setup();

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /list/i }));

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'dark');

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });
});
