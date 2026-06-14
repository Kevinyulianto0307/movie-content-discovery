import { useEffect, useState } from 'react';

// Returns a value that only updates after `delay` ms of no changes. Used to keep
// the search input from firing a request on every keystroke (300ms per the spec).
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
