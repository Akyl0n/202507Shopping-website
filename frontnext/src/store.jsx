import { useState } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === item.id);
      if (exist) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  // 同步后端删除
  const removeFromCart = async (id) => {
    const res = await fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      fetch('/api/cart', { credentials: 'include' })
        .then(r => r.json())
        .then(data => setCart(Array.isArray(data) ? data : (data.items || [])));
    }
  };

  // 同步后端的加减
  const increaseQty = async (id) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.qty + 1;
    const res = await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, qty: newQty })
    });
    if (res.ok) {
      // 刷新购物车
      fetch('/api/cart', { credentials: 'include' })
        .then(r => r.json())
        .then(data => setCart(Array.isArray(data) ? data : (data.items || [])));
    }
  };

  const decreaseQty = async (id) => {
    const item = cart.find(i => i.id === id);
    if (!item || item.qty <= 1) return;
    const newQty = item.qty - 1;
    const res = await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, qty: newQty })
    });
    if (res.ok) {
      fetch('/api/cart', { credentials: 'include' })
        .then(r => r.json())
        .then(data => setCart(Array.isArray(data) ? data : (data.items || [])));
    }
  };

  return { cart, addToCart, removeFromCart, setCart, increaseQty, decreaseQty };
}
