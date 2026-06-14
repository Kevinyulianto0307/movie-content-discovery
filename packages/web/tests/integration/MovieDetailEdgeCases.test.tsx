import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { render } from '../test-utils';
import { server } from '../test-utils/server';
import { http, HttpResponse } from 'msw';
import { MovieDetail } from '../../src/pages/MovieDetail';
import { createMockMovieDetail, createPaginatedResponse } from '../test-utils/mocks';

function renderMovieDetail(id: number) {
  return render(
    <Routes>
      <Route path="/movies/:id" element={<MovieDetail />} />
    </Routes>,
    { initialEntries: [`/movies/${id}`] },
  );
}

describe('MovieDetail Edge Cases - Branch Coverage', () => {
  describe('Missing optional fields', () => {
    it('renders without releaseYear', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({ releaseYear: null }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.queryByText(/\(\d{4}\)/)).not.toBeInTheDocument();
    });

    it('renders without tagline', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({ tagline: null }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.queryByText('Why So Serious?')).not.toBeInTheDocument();
    });

    it('renders without runtime', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({ runtime: null }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.queryByText(/\d+ min/)).not.toBeInTheDocument();
    });

    it('renders without ratings (count = 0)', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({ ratings: { average: null, count: 0 } }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.queryByText(/avg user rating/)).not.toBeInTheDocument();
    });

    it('renders without genres (empty array)', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({ genres: [] }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.queryByText('Drama')).not.toBeInTheDocument();
      expect(screen.queryByText('Action')).not.toBeInTheDocument();
    });

    it('renders without overview', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({ overview: null }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Batman raises the stakes/)).not.toBeInTheDocument();
    });

    it('renders without keywords (empty array)', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({ keywords: [] }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.queryByText('dc comics')).not.toBeInTheDocument();
    });
  });

  describe('Cast edge cases', () => {
    it('renders empty cast message when no cast', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({ cast: [] }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('No cast listed.')).toBeInTheDocument();
      });
    });

    it('renders cast member without character', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({
              cast: [
                { personId: 1, name: 'Actor Name', character: '', order: 0 },
              ],
            }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('Actor Name')).toBeInTheDocument();
      });
      expect(screen.queryByText(/as /)).not.toBeInTheDocument();
    });
  });

  describe('Crew edge cases', () => {
    it('renders no directors message when empty', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({
              crew: [
                { personId: 1, name: 'Some Writer', job: 'Writer', department: 'Writing' },
              ],
            }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Director:/)).not.toBeInTheDocument();
      expect(screen.getByText(/Writer:/)).toBeInTheDocument();
    });

    it('renders no writers message when empty', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({
              crew: [
                { personId: 1, name: 'Some Director', job: 'Director', department: 'Directing' },
              ],
            }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
      expect(screen.getByText(/Director:/)).toBeInTheDocument();
      expect(screen.queryByText(/Writer:/)).not.toBeInTheDocument();
    });

    it('renders no key crew message when both empty', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(
            createMockMovieDetail({
              crew: [
                { personId: 1, name: 'Camera Person', job: 'Camera', department: 'Camera' },
              ],
            }),
          );
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('No key crew listed.')).toBeInTheDocument();
      });
    });
  });

  describe('Similar movies edge cases', () => {
    it('renders empty similar movies message', async () => {
      server.use(
        http.get('/api/movies/:id/similar', () => {
          return HttpResponse.json(createPaginatedResponse([], { total: 0 }));
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('No similar movies found.')).toBeInTheDocument();
      });
    });

    it('renders similar movies loading state', async () => {
      server.use(
        http.get('/api/movies/:id/similar', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(createPaginatedResponse([], { total: 0 }));
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
      });
    });
  });

  describe('Movie not found', () => {
    it('renders movie not found when data is null', async () => {
      server.use(
        http.get('/api/movies/:id', () => {
          return HttpResponse.json(null);
        }),
      );

      renderMovieDetail(1);

      await waitFor(() => {
        expect(screen.getByText('Movie not found.')).toBeInTheDocument();
      });
    });
  });
});
