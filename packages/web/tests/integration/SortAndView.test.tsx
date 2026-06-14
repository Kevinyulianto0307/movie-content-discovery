import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import { Home } from '../../src/pages/Home';

describe('Sort and View Controls', () => {
  it('changes sort field via dropdown', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox');
    await user.selectOptions(sortSelect, 'title');

    expect(sortSelect).toHaveValue('title');
  });

  it('toggles sort order', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const orderButton = screen.getByRole('button', { name: /descending|ascending/i });
    const initialOrder = orderButton.textContent;

    await user.click(orderButton);

    expect(orderButton.textContent).not.toBe(initialOrder);
  });

  it('switches between grid and list view', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    const listButton = screen.getByRole('button', { name: /list/i });
    await user.click(listButton);

    expect(screen.getByRole('table')).toBeInTheDocument();

    const gridButton = screen.getByRole('button', { name: /grid/i });
    await user.click(gridButton);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('sorts table columns by clicking headers', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const listButton = screen.getByRole('button', { name: /list/i });
    await user.click(listButton);

    const titleHeader = screen.getByRole('button', { name: /title/i });
    await user.click(titleHeader);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('hides sort dropdown in list view', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox')).toBeInTheDocument();

    const listButton = screen.getByRole('button', { name: /list/i });
    await user.click(listButton);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('table headers are not sortable during search', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    const listButton = screen.getByRole('button', { name: /list/i });
    await user.click(listButton);

    expect(screen.getByRole('button', { name: /title/i })).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Dark');

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /title/i })).not.toBeInTheDocument();
    });
  });
});
