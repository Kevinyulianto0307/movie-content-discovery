import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { render } from '../test-utils';
import { server } from '../test-utils/server';
import { http, HttpResponse, delay } from 'msw';
import { Home } from '../../src/pages/Home';
import { MovieDetail } from '../../src/pages/MovieDetail';

function renderMovieDetail(id: number) {
  return render(
    <Routes>
      <Route path="/movies/:id" element={<MovieDetail />} />
    </Routes>,
    { initialEntries: [`/movies/${id}`] },
  );
}

describe('Error States Integration', () => {
  beforeEach(() => {
    // Reset handlers between tests to ensure clean state
    server.resetHandlers();
  });

  describe('Home page errors', () => {
    it('shows error message when /api/movies returns 500', async () => {
      server.use(
        http.get('/api/movies', async () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
          );
        }),
      );

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/couldn't load movies/i)).toBeInTheDocument();
      });
    });

    it('shows error message when /api/movies returns 503', async () => {
      server.use(
        http.get('/api/movies', async () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 },
          );
        }),
      );

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/couldn't load movies/i)).toBeInTheDocument();
      });
    });

    it('shows error message on network failure', async () => {
      server.use(
        http.get('/api/movies', async () => {
          return HttpResponse.error();
        }),
      );

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/couldn't load movies/i)).toBeInTheDocument();
      });
    });

    it('handles timeout gracefully', async () => {
      server.use(
        http.get('/api/movies', async () => {
          await delay(5000); // 5 second delay
          return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 });
        }),
      );

      render(<Home />);

      // Should show loading state during delay
      const skeletons = document.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Movie detail page errors', () => {
    it('shows error message when /api/movies/:id returns 500', async () => {
      server.use(
        http.get('/api/movies/:id', async () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/couldn't load this movie/i)).toBeInTheDocument();
      });
    });

    it('shows error message when /api/movies/:id returns 404', async () => {
      server.use(
        http.get('/api/movies/:id', async () => {
          return HttpResponse.json(
            { error: 'Movie not found' },
            { status: 404 },
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/couldn't load this movie/i)).toBeInTheDocument();
      });
    });

    it('shows error message on network failure', async () => {
      server.use(
        http.get('/api/movies/:id', async () => {
          return HttpResponse.error();
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/couldn't load this movie/i)).toBeInTheDocument();
      });
    });

    it('handles movie load timeout gracefully', async () => {
      server.use(
        http.get('/api/movies/:id', async () => {
          await delay(5000); // 5 second delay
          return HttpResponse.json({
            id: 1,
            title: 'Test Movie',
            genres: [],
            cast: [],
            crew: [],
            keywords: [],
            ratings: { count: 0 },
          });
        }),
      );

      renderMovieDetail(1);

      // Should show loading state during delay
      const skeletons = document.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Similar movies errors', () => {
    it('shows error for similar movies while main movie loads successfully', async () => {
      server.use(
        http.get('/api/movies/:id/similar', async () => {
          return HttpResponse.json(
            { error: 'Failed to load similar movies' },
            { status: 500 },
          );
        }),
      );

      renderMovieDetail(1);

      // Main movie should load successfully
      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      // Similar movies section should show error
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        const similarError = errorMessages.find(el =>
          el.textContent?.includes('similar movies'),
        );
        expect(similarError).toBeInTheDocument();
      });
    });

    it('handles similar movies network failure independently', async () => {
      server.use(
        http.get('/api/movies/:id/similar', async () => {
          return HttpResponse.error();
        }),
      );

      renderMovieDetail(1);

      // Main movie should load successfully
      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      // Similar movies section should show error
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        const similarError = errorMessages.find(el =>
          el.textContent?.includes('similar movies'),
        );
        expect(similarError).toBeInTheDocument();
      });
    });
  });

  describe('Search errors', () => {
    it('shows error message when /api/search returns 500', async () => {
      server.use(
        http.get('/api/search', async () => {
          return HttpResponse.json(
            { error: 'Search service unavailable' },
            { status: 500 },
          );
        }),
      );

      render(<Home />);

      // Wait for initial movies list to load
      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      // Type in search box to trigger search
      const searchInput = screen.getByPlaceholderText(/search/i);
      const user = await import('@testing-library/user-event').then(m => m.default.setup());
      await user.type(searchInput, 'test query');

      // Should show error after search fails
      await waitFor(
        () => {
          expect(screen.getByRole('alert')).toBeInTheDocument();
          expect(screen.getByText(/couldn't load movies/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('shows error message when /api/search returns 503', async () => {
      server.use(
        http.get('/api/search', async () => {
          return HttpResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 503 },
          );
        }),
      );

      render(<Home />);

      // Wait for initial movies list to load
      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      // Type in search box to trigger search
      const searchInput = screen.getByPlaceholderText(/search/i);
      const user = await import('@testing-library/user-event').then(m => m.default.setup());
      await user.type(searchInput, 'test query');

      // Should show error after search fails
      await waitFor(
        () => {
          expect(screen.getByRole('alert')).toBeInTheDocument();
          expect(screen.getByText(/couldn't load movies/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('handles search network failure', async () => {
      server.use(
        http.get('/api/search', async () => {
          return HttpResponse.error();
        }),
      );

      render(<Home />);

      // Wait for initial movies list to load
      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      // Type in search box to trigger search
      const searchInput = screen.getByPlaceholderText(/search/i);
      const user = await import('@testing-library/user-event').then(m => m.default.setup());
      await user.type(searchInput, 'test query');

      // Should show error after search fails
      await waitFor(
        () => {
          expect(screen.getByRole('alert')).toBeInTheDocument();
          expect(screen.getByText(/couldn't load movies/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('handles search timeout gracefully', async () => {
      server.use(
        http.get('/api/search', async () => {
          await delay(5000); // 5 second delay
          return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 });
        }),
      );

      render(<Home />);

      // Wait for initial movies list to load
      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });

      // Type in search box to trigger search
      const searchInput = screen.getByPlaceholderText(/search/i);
      const user = await import('@testing-library/user-event').then(m => m.default.setup());
      await user.type(searchInput, 'test query');

      // Should show loading state during delay
      await waitFor(() => {
        const skeletons = document.querySelectorAll('[aria-hidden="true"]');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multiple concurrent errors', () => {
    it('handles both main movie and similar movies failing', async () => {
      server.use(
        http.get('/api/movies/:id', async () => {
          return HttpResponse.json(
            { error: 'Movie service down' },
            { status: 500 },
          );
        }),
        http.get('/api/movies/:id/similar', async () => {
          return HttpResponse.json(
            { error: 'Similar movies service down' },
            { status: 500 },
          );
        }),
      );

      renderMovieDetail(1);

      // Should show error for main movie (similar movies won't even be queried)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/couldn't load this movie/i)).toBeInTheDocument();
      });
    });
  });

  describe('Partial failures', () => {
    it('main movie success with similar movies failure shows both states', async () => {
      server.use(
        http.get('/api/movies/:id/similar', async () => {
          return HttpResponse.json(
            { error: 'Similar movies unavailable' },
            { status: 500 },
          );
        }),
      );

      renderMovieDetail(1);

      // Wait for successful main movie load
      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
        expect(screen.getByText('Why So Serious?')).toBeInTheDocument();
      });

      // Verify similar movies section shows error
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
        expect(screen.getByText(/couldn't load similar movies/i)).toBeInTheDocument();
      });
    });
  });
});
