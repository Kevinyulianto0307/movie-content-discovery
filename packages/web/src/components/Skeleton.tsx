import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

/** Animated placeholder while content is loading. */
export function Skeleton({ width, height, borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
      aria-hidden="true"
    />
  );
}

/** Skeleton grid matching the MovieCard layout for browse/search loading states. */
export function MovieCardSkeleton() {
  return (
    <div className={styles.card}>
      <Skeleton height={20} width="80%" className={styles.title} />
      <div className={styles.meta}>
        <Skeleton height={16} width={50} />
        <Skeleton height={16} width={60} />
      </div>
    </div>
  );
}

/** Multiple card skeletons for grid loading state. */
export function MovieGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </>
  );
}

/** Skeleton for table row loading state. */
export function MovieTableRowSkeleton() {
  return (
    <tr className={styles.row}>
      <td><Skeleton height={16} width="70%" /></td>
      <td><Skeleton height={16} width={90} /></td>
      <td className={styles.right}><Skeleton height={16} width={30} /></td>
      <td className={styles.right}><Skeleton height={16} width={50} /></td>
      <td className={styles.right}><Skeleton height={16} width={80} /></td>
    </tr>
  );
}

/** Multiple table row skeletons for list loading state. */
export function MovieTableSkeleton({ count = 10 }: { count?: number }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Title</th>
          <th>Release Date</th>
          <th className={styles.right}>Rating</th>
          <th className={styles.right}>Votes</th>
          <th className={styles.right}>Revenue</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: count }, (_, i) => (
          <MovieTableRowSkeleton key={i} />
        ))}
      </tbody>
    </table>
  );
}

/** Skeleton for movie detail page header. */
export function MovieDetailSkeleton() {
  return (
    <div className={styles.detail}>
      <Skeleton height={32} width="60%" className={styles.detailTitle} />
      <Skeleton height={18} width="40%" className={styles.detailTagline} />
      <div className={styles.detailBadges}>
        <Skeleton height={20} width={60} borderRadius={4} />
        <Skeleton height={20} width={80} borderRadius={4} />
        <Skeleton height={20} width={120} borderRadius={4} />
      </div>
      <Skeleton height={80} width="100%" className={styles.detailOverview} />
    </div>
  );
}
