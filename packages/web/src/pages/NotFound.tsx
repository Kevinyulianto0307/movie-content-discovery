import { Link } from 'react-router-dom';
import { StateMessage } from '../components/StateMessage.js';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <div className={styles.page}>
      <StateMessage kind="empty">
        <h2 className={styles.title}>Page not found</h2>
        <p className={styles.text}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className={styles.link}>
          ← Back to browse
        </Link>
      </StateMessage>
    </div>
  );
}
