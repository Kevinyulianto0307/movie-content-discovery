import styles from './Pagination.module.css';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

// Prev/next pagination (numbered pages were cut for time — documented in the ADR).
export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isFirst = page <= 1;
  const isLast = page >= totalPages;
  return (
    <nav className={styles.bar} aria-label="Pagination">
      <button
        className={styles.button}
        onClick={() => onPageChange(page - 1)}
        disabled={isFirst}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      <span className={styles.info} aria-live="polite">
        Page {page} of {totalPages} · {total.toLocaleString()} results
      </span>
      <button
        className={styles.button}
        onClick={() => onPageChange(page + 1)}
        disabled={isLast}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
