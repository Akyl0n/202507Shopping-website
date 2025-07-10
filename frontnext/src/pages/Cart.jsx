import React, { useEffect, useState } from 'react';
import { useCart } from '../store.jsx';
import styles from './Cart.module.css';
import { useNavigate } from 'react-router-dom';
import { useCheckoutOrderStore } from '../checkoutOrderStore.js';

const Cart = () => {
  const { cart, setCart, removeFromCart, increaseQty, decreaseQty } = useCart();
  const { order } = useCheckoutOrderStore();
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  const allSelected = cart.length > 0 && selected.length === cart.length;

  const handleSelectAll = (checked) => {
    if (checked) setSelected(cart.map(item => item.id));
    else setSelected([]);
  };

  const handleSelect = (id, checked) => {
    if (checked) setSelected(prev => [...prev, id]);
    else setSelected(prev => prev.filter(i => i !== id));
  };

  useEffect(() => {
    fetch('/api/cart', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCart(data);
        } else if (data && Array.isArray(data.items)) {
          setCart(data.items);
        }
      })
      .catch(() => {
        setCart([]);
      });
  }, []);

  const handleCheckout = () => {
    if (order && order.status === 'pending') {
      alert('有订单待处理，请先付款或取消');
      navigate('/checkout');
      return;
    }
    if (selected.length === 0) {
      alert('请先选择要购买的商品');
      return;
    }

    localStorage.setItem('checkout_selected_ids', JSON.stringify(selected));
    navigate('/checkout', { state: { selectedIds: selected } });
  };

  return (
    <div className={styles['cart-container']}>
      <div style={{ padding: '0 0 8px 0' }}>
        <h2 className={styles['cart-title']} style={{ marginBottom: 4 }}>购物车</h2>
        <label
          style={{
            fontSize: '0.98rem',
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            userSelect: 'none',
            marginLeft: 2,
          }}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={e => handleSelectAll(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          <span style={{ fontSize: '0.92rem' }}>全选</span>
        </label>
      </div>

      {cart.length === 0 ? (
        <div className={styles['cart-list']}>
          <div
            className={styles['cart-card']}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              height: '120px',
              minHeight: '120px',
              maxHeight: '120px',
            }}
          >
            <span className={styles['cart-empty']}>购物车为空</span>
          </div>
        </div>
      ) : (
        <div className={styles['cart-list']}>
          {cart.map(item => (
            <div className={styles['cart-card']} key={item.id}>
              <div className={styles['cart-card-header']}>
                <span className={styles['cart-shop']}>{item.shop || '默认店铺'}</span>
              </div>
              <div className={styles['cart-card-body']}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginRight: 12,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={e => handleSelect(item.id, e.target.checked)}
                  />
                  <span style={{ fontSize: '0.97rem', color: '#888' }}>选中</span>
                </label>
                <img
                  className={styles['cart-img']}
                  src={
                    item.img ||
                    'https://img.alicdn.com/imgextra/i4/6000000000422/O1CN01Qw2QwB1CkQwZ0pQwB_!!6000000000422-0-tbvideo.jpg'
                  }
                  alt={item.name}
                />
                <div className={styles['cart-info']}>
                  <div className={styles['cart-title-main']}>{item.name}</div>
                  <div className={styles['cart-model']}>型号：{item.model || '默认型号'}</div>
                  <div className={styles['cart-price']}>单价：￥{item.price}</div>
                  <div className={styles['cart-qty']}>
                    数量：
                    <button
                      className={styles['cart-btn']}
                      onClick={() => decreaseQty(item.id)}
                      disabled={item.qty <= 1}
                    >
                      -
                    </button>
                    <span className={styles['cart-qty-num']}>{item.qty}</span>
                    <button
                      className={styles['cart-btn']}
                      onClick={() => increaseQty(item.id)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  className={styles['cart-remove']}
                  onClick={() => removeFromCart(item.id)}
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className={styles['cart-checkout-bar']}>
          <button className={styles['cart-checkout-btn']} onClick={handleCheckout}>
            购买
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
