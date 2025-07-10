import { useState, useEffect } from 'react';

export function useOrderCounts() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/order/counts', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCounts(data || {});
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { counts, loading, error };
}
