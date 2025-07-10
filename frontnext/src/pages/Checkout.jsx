import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../store.jsx';
import { useCheckoutOrderStore } from '../checkoutOrderStore.js';
import styles from './Cart.module.css';

const Checkout = () => {
  const { cart, setCart, removeFromCart } = useCart();
  const { order, clearOrder } = useCheckoutOrderStore();
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');

  // 选中的购物车项id
  let selectedIds = (location.state && location.state.selectedIds) || [];
  if (selectedIds.length === 0) {
    // 尝试从localStorage恢复
    try {
      const local = JSON.parse(localStorage.getItem('checkout_selected_ids'));
      if (Array.isArray(local)) selectedIds = local;
    } catch {
      // intentionally ignored
    }
  }
  // 结算页挂载时自动拉取购物车数据或订单明细
  useEffect(() => {
    setLoading(true);
    if (orderId) {
      // 订单支付场景，拉取订单明细
      fetch(`/api/order/detail?id=${orderId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setCart([]); // 清空购物车
          setOrderDetail(data);
          setLoading(false);
        })
        .catch(() => { setOrderDetail(null); setLoading(false); });
    } else {
      // 购物车结算场景
      fetch('/api/cart', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCart(data);
          else if (data && Array.isArray(data.items)) setCart(data.items);
          setLoading(false);
        })
        .catch(() => { setCart([]); setLoading(false); });
    }
  }, [setCart, orderId]);

  // 新增：订单明细状态
  const [orderDetail, setOrderDetail] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false); // 新增：支付弹窗状态

  const selectedItems = cart.filter(item => selectedIds.includes(item.id));
  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // 订单持久化逻辑
  const hasPendingOrder = order && order.status === 'pending';

  // 提交订单
  const handleSubmitOrder = async () => {
    if (hasPendingOrder) {
      alert('有未完成订单，请先付款或取消');
      return;
    }
    if (selectedItems.length === 0) {
      alert('未选中商品');
      return;
    }
    setLoading(true);
    // 构造后端需要的订单数据
    const items = selectedItems.map(item => ({
      product_id: item.product_id,
      model_id: item.model_id,
      quantity: item.qty,
      price: item.price // 新增，适配后端明细表
    }));
    // 获取用户地址（如有需要可从用户信息store获取）
    let address = '';
    try {
      const res = await fetch('/api/user/address', { credentials: 'include' });
      const data = await res.json();
      if (data && data.address) address = data.address;
    } catch {
      // intentionally ignored
    }
    // 提交订单到后端
    const res = await fetch('/api/order/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ items, address, total }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      clearOrder();
      selectedItems.forEach(item => removeFromCart(item.id));
      if (data.order_id) {
        alert('下单成功，请尽快付款！');
        navigate(`/order/detail/${data.order_id}`);
      } else if (data.order_ids && Array.isArray(data.order_ids) && data.order_ids.length > 0) {
        alert('下单成功，请尽快付款！');
        navigate(`/order/detail/${data.order_ids[0]}`);
      } else {
        alert('下单成功，请尽快付款！');
        navigate('/order/pending');
      }
    } else {
      alert('下单失败');
    }
  };

  // 订单支付后刷新明细
  const handlePay = async () => {
    if (!orderId) return;
    try {
      // 假设后端有支付接口
      const res = await fetch(`/api/order/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ order_id: Number(orderId) })
      });
      const text = await res.text();
      console.log('pay response:', res.status, text); // 调试输出
      if (res.ok) {
        alert('模拟付款成功！');
        setShowPayModal(false);
        // 支付后刷新订单明细
        const detailRes = await fetch(`/api/order/detail?id=${orderId}`, { credentials: 'include' });
        const detail = await detailRes.json();
        setOrderDetail(detail);
      } else {
        alert('支付失败');
      }
    } catch {
      alert('支付异常');
    }
  };

  // 渲染逻辑
  if (loading) return <div className={styles['cart-container']}>加载中...</div>;
  if (orderId && orderDetail) {
    // 订单支付场景
    return (
      <>
        <div className={styles['cart-container']}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
            <h2 className={styles['cart-title']} style={{marginBottom:0}}>订单支付</h2>
            <button onClick={()=>navigate(-1)} style={{fontSize:'1rem',color:'#1976d2',background:'none',border:'none',cursor:'pointer'}}>返回</button>
          </div>
          <div className={styles['cart-list']}>
            <div className={styles['cart-card']}>
              <div className={styles['cart-card-header']}>
                <span>订单号：{orderDetail.id}</span>
                <span style={{marginLeft:24}}>状态：{orderDetail.status}</span>
              </div>
              <div className={styles['cart-card-body']}>
                <div>商品明细：</div>
                <ul style={{margin:'8px 0 12px 0',paddingLeft:20}}>
                  {orderDetail.items && orderDetail.items.length > 0 ? orderDetail.items.map((item, idx) => (
                    <li key={idx} style={{marginBottom:6}}>
                      商品ID: {item.product_id}，型号ID: {item.model_id}，数量: {item.quantity}，单价: ￥{item.price}
                    </li>
                  )) : <li>无商品明细</li>}
                </ul>
                <div>总金额：￥{orderDetail.total_price}</div>
                <div>收货地址：{orderDetail.address}</div>
                <div>下单时间：{orderDetail.created_at}</div>
              </div>
            </div>
          </div>
          {/* 支付操作栏 */}
          <div className={styles['cart-checkout-bar']}>
            {orderDetail.status === 'pending' && (
              <button className={styles['cart-checkout-btn']} onClick={()=>setShowPayModal(true)}>去付款</button>
            )}
          </div>
        </div>
        {/* 模拟付款弹窗（订单支付场景） */}
        {orderId && showPayModal && (
          <div style={{position:'fixed',left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#fff',borderRadius:12,padding:32,minWidth:260,boxShadow:'0 2px 16px #ccc',textAlign:'center'}}>
              <div style={{fontWeight:'bold',fontSize:'1.1rem',marginBottom:18}}>模拟付款</div>
              <div style={{marginBottom:18}}>请选择付款状态：</div>
              <button style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 24px',fontSize:'1rem',cursor:'pointer',marginRight:12}} onClick={handlePay}>我已付款</button>
              <button style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 24px',fontSize:'1rem',cursor:'pointer'}} onClick={()=>setShowPayModal(false)}>暂未付款</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // 持久化订单状态下，禁止新提交
  const canSubmit = !hasPendingOrder && selectedItems.length > 0;

  return (
    <div className={styles['cart-container']}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <h2 className={styles['cart-title']} style={{marginBottom:0}}>结算</h2>
        <button onClick={()=>navigate(-1)} style={{fontSize:'1rem',color:'#1976d2',background:'none',border:'none',cursor:'pointer'}}>返回</button>
      </div>
      {selectedItems.length === 0 ? (
        <div className={styles['cart-list']}>
          <div className={styles['cart-card']} style={{justifyContent:'center',alignItems:'center',display:'flex',height:'120px',minHeight:'120px',maxHeight:'120px'}}>
            <span className={styles['cart-empty']}>未选中任何商品</span>
          </div>
        </div>
      ) : (
        <div className={styles['cart-list']}>
          {selectedItems.map(item => (
            <div className={styles['cart-card']} key={item.id}>
              <div className={styles['cart-card-header']}>
                <span className={styles['cart-shop']}>{item.shop || '默认店铺'}</span>
              </div>
              <div className={styles['cart-card-body']}>
                <img className={styles['cart-img']} src={item.img || 'https://img.alicdn.com/imgextra/i4/6000000000422/O1CN01Qw2QwB1CkQwZ0pQwB_!!6000000000422-0-tbvideo.jpg'} alt={item.name} />
                <div className={styles['cart-info']}>
                  <div className={styles['cart-title-main']}>{item.name}</div>
                  <div className={styles['cart-model']}>型号：{item.model || '默认型号'}</div>
                  <div className={styles['cart-price']}>单价：￥{item.price}</div>
                  <div className={styles['cart-qty']}>数量：<span className={styles['cart-qty-num']}>{item.qty}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 底部悬浮结算条 */}
      {selectedItems.length > 0 && (
        <div className={styles['cart-checkout-bar']}>
          <div style={{flex:1,textAlign:'left',fontSize:'1.1rem',color:'#1976d2',fontWeight:'bold',paddingLeft:24}}>合计：￥{total.toFixed(2)}</div>
          <button className={styles['cart-checkout-btn']} onClick={handleSubmitOrder} disabled={!canSubmit}>提交订单</button>
        </div>
      )}
    </div>
  );
};

export default Checkout;
