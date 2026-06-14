import styles from './SearchBar.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// Controlled input. The debounce lives in the parent (Home) so the input stays
// responsive while requests are throttled.
export function SearchBar({ value, onChange }: Props) {
  return (
    <div className={styles.wrap}>
      <input
        className={styles.input}
        type="search"
        placeholder="Search movies by title, tagline, or overview…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search movies"
      />
    </div>
  );
}
