import { Link } from 'react-router-dom';
import type { SortField, SearchSortField, SortOrder } from '../api/client.js';
import { formatReleaseDate } from '../lib/date.js';
import { formatCount, formatRating, formatRevenue } from '../lib/format.js';
import styles from './MovieTable.module.css';

interface Row {
  id: number;
  title: string;
  releaseDate: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  revenue?: number | null;
}

interface BrowseProps {
  items: Row[];
  sort: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
  isSearching?: false;
}

interface SearchProps {
  items: Row[];
  sort: SearchSortField;
  order: SortOrder;
  onSort: (field: SearchSortField) => void;
  isSearching: true;
}

type Props = BrowseProps | SearchProps;

interface HeaderProps {
  label: string;
  field?: SortField;
  right?: boolean;
  sort?: SortField | SearchSortField;
  order?: SortOrder;
  onSort?: (field: SortField) => void;
}

function Header({ label, field, right, sort, order, onSort }: HeaderProps) {
  const sortable = !!onSort && !!field;
  const active = sortable && sort === field;
  return (
    <th
      className={right ? styles.right : undefined}
      aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
      scope="col"
    >
      {sortable ? (
        <button type="button" className={styles.th} onClick={() => onSort!(field!)}>
          {label}
          {active ? <span className={styles.caret}>{order === 'asc' ? ' ▲' : ' ▼'}</span> : null}
        </button>
      ) : (
        label
      )}
    </th>
  );
}

export function MovieTable({ items, sort, order, onSort }: Props) {
  const headerProps = { sort, order, onSort: onSort as (field: SortField) => void };
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <Header label="Title" field="title" {...headerProps} />
          <Header label="Release Date" field="release_date" {...headerProps} />
          <Header label="Rating" field="vote_average" right {...headerProps} />
          <Header label="Votes" right {...headerProps} />
          <Header label="Revenue" field="revenue" right {...headerProps} />
        </tr>
      </thead>
      <tbody>
        {items.map((m) => (
          <tr key={m.id}>
            <td>
              <Link to={`/movies/${m.id}`} className={styles.link}>
                {m.title}
              </Link>
            </td>
            <td>{formatReleaseDate(m.releaseDate)}</td>
            <td className={styles.right}>{formatRating(m.voteAverage)}</td>
            <td className={styles.right}>{formatCount(m.voteCount)}</td>
            <td className={styles.right}>{formatRevenue(m.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
