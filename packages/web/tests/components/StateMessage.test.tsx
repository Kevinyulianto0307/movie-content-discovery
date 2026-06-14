import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StateMessage } from '../../src/components/StateMessage';

describe('StateMessage', () => {
  it('renders loading message with status role', () => {
    render(<StateMessage kind="loading">Loading data...</StateMessage>);

    const message = screen.getByRole('status');
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent('Loading data...');
  });

  it('renders error message with alert role', () => {
    render(<StateMessage kind="error">Something went wrong</StateMessage>);

    const message = screen.getByRole('alert');
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent('Something went wrong');
  });

  it('renders empty message with status role', () => {
    render(<StateMessage kind="empty">No items found</StateMessage>);

    const message = screen.getByRole('status');
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent('No items found');
  });

  it('renders children as content', () => {
    render(
      <StateMessage kind="loading">
        <span data-testid="custom-content">Custom loading</span>
      </StateMessage>,
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });
});
