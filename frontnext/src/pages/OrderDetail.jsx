import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Order.module.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/order/detail?id=${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError('加载失败');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className={styles['order-list']}>加载中...</div>;
  if (error) return <div className={styles['order-list']}>{error}</div>;
  if (!order) return null;

  return (
    <div className={styles['order-list']} style={{maxWidth:600,margin:'0 auto'}}>
      <div className={styles['order-card']} style={{marginTop:32}}>
        <div className={styles['order-card-header']}>
          <span>订单号：{order.id}</span>
          <span style={{marginLeft:24}}>状态：{order.status}</span>
        </div>
        <div className={styles['order-card-body']}>
          <div>商品明细：</div>
          <ul style={{margin:'8px 0 12px 0',paddingLeft:20}}>
            {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
              <li key={idx} style={{marginBottom:6}}>
                商品ID: {item.product_id}，型号ID: {item.model_id}，数量: {item.quantity}，单价: ￥{item.price}
              </li>
            )) : <li>无商品明细</li>}
          </ul>
          <div>总金额：￥{order.total_price}</div>
          <div>收货地址：{order.address}</div>
          <div>下单时间：{order.created_at}</div>
        </div>
        <div className={styles['order-card-footer']} style={{marginTop:16}}>
          <button style={{marginLeft:16}} onClick={()=>navigate(-1)}>返回</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
