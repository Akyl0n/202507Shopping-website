import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useOrderCounts } from '../hooks/useOrderCounts';
import styles from './Order.module.css';

const orderTabs = [
  { key: 'pending', label: '待付款' },
  { key: 'toship', label: '待发货' },
  { key: 'toreceive', label: '待收货' },
  { key: 'toreview', label: '待评价' },
  { key: 'refund', label: '退款/售后' },
];

const Order = () => {
  const { counts } = useOrderCounts();

  return (
    <div className={styles['order-page-container']}>
      <div className={styles['order-tabs']}>
        {orderTabs.map(tab => (
          <NavLink
            key={tab.key}
            to={`/order/${tab.key}`}
            className={({ isActive }) => isActive ? styles['order-tab-active'] + ' ' + styles['order-tab'] : styles['order-tab']}
          >
            {tab.label}
            {typeof counts[tab.key] === 'number' && (
              <span style={{
                background: '#e3eafc', color: '#1976d2', borderRadius: '8px', fontSize: '0.95em', marginLeft: 6, padding: '2px 8px', minWidth: 18, display: 'inline-block', textAlign: 'center', fontWeight: 500
              }}>{counts[tab.key]}</span>
            )}
          </NavLink>
        ))}
      </div>
      <div className={styles['order-content']}>
        <Outlet />
      </div>
    </div>
  );
};

export default Order;
