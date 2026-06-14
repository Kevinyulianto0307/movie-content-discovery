import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockMovies,
  mockSimilarMovies,
  createMockMovieDetail,
  createPaginatedResponse,
} from './mocks';

export const handlers = [
  http.get('/api/movies', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;

    return HttpResponse.json(
      createPaginatedResponse(mockMovies, { page, pageSize, total: mockMovies.length }),
    );
  }),

  http.get('/api/movies/:id', ({ params }) => {
    const id = Number(params.id);
    if (id === 999) {
      return HttpResponse.json({ error: 'Movie not found' }, { status: 404 });
    }
    return HttpResponse.json(createMockMovieDetail({ id }));
  }),

  http.get('/api/movies/:id/similar', () => {
    return HttpResponse.json(
      createPaginatedResponse(mockSimilarMovies, { total: mockSimilarMovies.length }),
    );
  }),

  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const page = Number(url.searchParams.get('page')) || 1;

    if (!q.trim()) {
      return HttpResponse.json(createPaginatedResponse([], { page, total: 0 }));
    }

    const filtered = mockMovies.filter((m) =>
      m.title.toLowerCase().includes(q.toLowerCase()),
    );

    return HttpResponse.json(createPaginatedResponse(filtered, { page, total: filtered.length }));
  }),
];

export const server = setupServer(...handlers);
