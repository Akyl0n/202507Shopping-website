import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';
import { useUser } from '../useUser.js';
import Order from './Order.jsx';

const defaultAvatarUrl = 'https://img.alicdn.com/sns_logo/i2/4018057314/O1CN0125ceLs23trpswnVHn_!!4018057314-0-userheaderimgshow.jpg';

const UserProfile = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  // 订单状态数量
  const [orderCounts, setOrderCounts] = useState({
    pending: 0,
    toship: 0,
    toreceive: 0,
    toreview: 0,
    refund: 0
  });

  // 获取用户详细信息
  useEffect(() => {
    if (!user) return;
    fetch('/api/user/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('用户信息获取失败');
        return res.json();
      })
      .then(data => {
        setNickname(data.nickname || '未设置昵称');
        setAvatar(data.avatar ? (data.avatar.startsWith('http') ? data.avatar : `/api${data.avatar}`) : defaultAvatarUrl);
        setAddress(data.address || '未设置');
      })
      .catch(() => {
        setNickname('未设置昵称');
        setAvatar(defaultAvatarUrl);
        setAddress('未设置');
      });
    // 获取订单状态数量
    fetch('/api/order/counts', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('订单数量获取失败');
        return res.json();
      })
      .then(data => {
        setOrderCounts({
          pending: data.pending || 0,
          toship: data.toship || 0,
          toreceive: data.toreceive || 0,
          toreview: data.toreview || 0,
          refund: data.refund || 0
        });
      })
      .catch(() => {
        setOrderCounts({ pending: 0, toship: 0, toreceive: 0, toreview: 0, refund: 0 });
      });
  }, [user]);

  if (!user) return <div className={styles['auth-container']}>请先登录</div>;

  // 用户信息展示区
  return (
    <div className={styles['auth-container']}>
      <div className={styles['user-profile-row']}>
        {/* 用户信息卡片 */}
        <div className={styles['user-info']}>
          <div className={styles['user-avatar']} onClick={() => navigate('/profile/edit')} style={{cursor:'pointer'}}>
            {avatar && <img src={avatar} alt="avatar" />}
            <div className={styles['edit-tip']} onClick={e => {e.stopPropagation();navigate('/profile/edit');}}>编辑资料</div>
          </div>
          <div className={styles['user-meta']}>
            <div className={styles['user-nickname']} title={nickname}>{nickname}</div>
            <div className={styles['user-account']}><span>账号：</span><span>{user}</span></div>
            <div className={styles['user-address']}>
              默认收货地址：{address}
            </div>
            <button
              className={styles['logout-btn']}
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                setUser(null);
                navigate('/auth');
              }}
            >退出登录</button>
          </div>
        </div>
        {/* 我的订单卡片 */}
        <div className={styles['order-container']}>
          <div className={styles['order-title']}>我的订单</div>
          <div className={styles['order-info']}>
            <div className={styles['order-item']} onClick={() => navigate('/order/pending')}><div className={styles['order-value']}>{orderCounts.pending}</div><div className={styles['order-label']}>待付款</div></div>
            <div className={styles['order-item']} onClick={() => navigate('/order/toship')}><div className={styles['order-value']}>{orderCounts.toship}</div><div className={styles['order-label']}>待发货</div></div>
            <div className={styles['order-item']} onClick={() => navigate('/order/toreceive')}><div className={styles['order-value']}>{orderCounts.toreceive}</div><div className={styles['order-label']}>待收货</div></div>
            <div className={styles['order-item']} onClick={() => navigate('/order/toreview')}><div className={styles['order-value']}>{orderCounts.toreview}</div><div className={styles['order-label']}>待评价</div></div>
            <div className={styles['order-item']} onClick={() => navigate('/order/refund')}><div className={styles['order-value']}>{orderCounts.refund}</div><div className={styles['order-label']}>退款/售后</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;