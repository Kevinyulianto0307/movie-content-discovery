import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StateMessage } from './StateMessage.js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

// Catches render-time errors so a single broken component doesn't take down
// the whole app. Async errors from queries/effects don't pass through here —
// TanStack Query handles those via the `isError` state on each query.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Logged so the error is visible in dev tools / future error-reporting.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <StateMessage kind="error">Something went wrong. Try reloading the page.</StateMessage>
        )
      );
    }
    return this.props.children;
  }
}
