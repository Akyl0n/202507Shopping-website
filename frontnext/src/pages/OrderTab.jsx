import React, { useEffect } from 'react';
import { useOrderList } from '../hooks/useOrderList';
import styles from './Cart.module.css';

const statusMap = {
  '待付款': 'pending',
  '待发货': 'toship',
  '待收货': 'toreceive',
  '待评价': 'toreview',
  '退款/售后': 'refund',
};

const OrderTab = ({ label }) => {
  const status = statusMap[label] || 'pending';
  const { orders, loading, error } = useOrderList(status);

  useEffect(() => {}, [status]);

  if (loading) return <div style={{marginTop:40,textAlign:'center'}}>加载中...</div>;
  if (error) return <div style={{marginTop:40,textAlign:'center',color:'#e53935'}}>加载失败</div>;

  return (
    <div style={{marginTop:40, display:'flex', justifyContent:'center'}}>
      <div className={styles['order-tab-outer']} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        width: '100%',
        maxWidth: 600,
        minHeight: 120,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 16px #f0f1f2',
        padding: '0 0 24px 0',
        transition: 'min-height 0.2s',
        alignItems: 'stretch',
      }}>
        {orders.length === 0 ? (
          <div className={styles['order-tab-empty']}>暂无{label}</div>
        ) : (
          orders.map(order => (
            <div className={styles['cart-card']} key={order.id}>
              <div className={styles['cart-card-header']}>
                <span className={styles['cart-shop']}>订单号：{order.id}</span>
                {/* 订单创建时间 */}
                <span style={{float:'right',color:'#888',fontSize:'0.97em'}}>
                  {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                </span>
              </div>
              <div className={styles['cart-card-body']}>
                <div className={styles['cart-info']} style={{width:'100%'}}>
                  <div className={styles['cart-title-main']}>下单时间：{order.created_at ? new Date(order.created_at).toLocaleString() : ''}</div>
                  <div className={styles['cart-qty']}>商品数量：<span className={styles['cart-qty-num']}>{order.item_count}</span></div>
                  <div style={{fontWeight:'bold',color:'#1976d2',marginTop:8}}>总金额：￥{order.total_price}</div>
                </div>
                {/* 待处理按钮，仅待付款tab显示 */}
                {status === 'pending' && (
                  <button
                    className={styles['cart-checkout-btn']}
                    style={{marginLeft:24,alignSelf:'flex-end',height:40,padding:'0 32px'}}
                    onClick={()=>window.location.href=`/checkout?orderId=${order.id}`}
                  >
                    待付款
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderTab;
