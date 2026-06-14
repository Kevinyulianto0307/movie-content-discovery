import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../../src/components/Layout';

function renderLayout(content: React.ReactNode) {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={content} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  it('renders header with app title', () => {
    renderLayout(<div>Page content</div>);

    expect(screen.getByRole('heading', { name: /movie content discovery/i })).toBeInTheDocument();
  });

  it('renders subtitle with movie count', () => {
    renderLayout(<div>Page content</div>);

    expect(screen.getByText(/~45,000 movies/)).toBeInTheDocument();
  });

  it('renders page content in main section', () => {
    renderLayout(<div>Page content</div>);

    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(screen.getByText('Page content'));
  });

  it('has link to home in header', () => {
    renderLayout(<div>Page content</div>);

    const homeLink = screen.getByRole('link', { name: /movie content discovery/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
