import type { ReactNode } from 'react';
import styles from './StateMessage.module.css';

// Shared presentational component for loading / error / empty states so every
// data-fetching view renders them consistently.
export function StateMessage({
  kind,
  children,
}: {
  kind: 'loading' | 'error' | 'empty';
  children: ReactNode;
}) {
  return (
    <div
      className={`${styles.message} ${styles[kind]}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
