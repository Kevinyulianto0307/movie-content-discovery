import styles from './ViewToggle.module.css';

export type View = 'grid' | 'list';

interface Props {
  view: View;
  onChange: (v: View) => void;
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="2" cy="3" r="1.2" />
      <rect x="5" y="2.2" width="10" height="1.6" rx="0.8" />
      <circle cx="2" cy="8" r="1.2" />
      <rect x="5" y="7.2" width="10" height="1.6" rx="0.8" />
      <circle cx="2" cy="13" r="1.2" />
      <rect x="5" y="12.2" width="10" height="1.6" rx="0.8" />
    </svg>
  );
}

// Segmented control: one button per layout (icon + label); the selected view is
// highlighted. Grid is selected by default.
export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className={styles.group} role="group" aria-label="Layout">
      <button
        type="button"
        className={`${styles.btn} ${view === 'grid' ? styles.active : ''}`}
        onClick={() => onChange('grid')}
        aria-pressed={view === 'grid'}
        title="Grid view"
      >
        <GridIcon />
        <span>Grid</span>
      </button>
      <button
        type="button"
        className={`${styles.btn} ${view === 'list' ? styles.active : ''}`}
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        title="List view"
      >
        <ListIcon />
        <span>List</span>
      </button>
    </div>
  );
}
