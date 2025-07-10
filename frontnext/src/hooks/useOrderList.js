import { useEffect, useState } from 'react';

export function useOrderList(status) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!status) return;
    setLoading(true);
    fetch(`/api/order/list?status=${status}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [status]);

  return { orders, loading, error };
}
