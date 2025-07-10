import React, { useState, useEffect } from 'react';
import styles from './Auth.module.css';
import axios from 'axios';
import { useUser } from '../useUser.js';

const avatarUrl = 'https://img.alicdn.com/sns_logo/i2/4018057314/O1CN0125ceLs23trpswnVHn_!!4018057314-0-userheaderimgshow.jpg';

const Auth = () => {
  const [tab, setTab] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', confirm: '', nickname: '', address: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, setUser } = useUser();
  const [showAddress, setShowAddress] = useState(false);
  const [address, setAddress] = useState('未设置');
  const [addressLoading, setAddressLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [nickname, setNickname] = useState(user || '');

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('/api/user/profile', { withCredentials: true });
      if (res.data && res.data.success) {
        setNickname(res.data.nickname || '');
        setAddress(res.data.address || '未设置');
      }
    } catch {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!loginData.username || !loginData.password) {
      setError('请输入用户名和密码');
      return;
    }
    try {
      const res = await axios.post('/api/login', loginData, { withCredentials: true });
      setSuccess(res.data.message || '登录成功');
      setUser(loginData.username);
      await fetchUserProfile();
    } catch (err) {
      let errorMsg = '登录失败';
      if (err && err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!registerData.username || !registerData.password) {
      setError('请输入用户名和密码');
      return;
    }
    if (registerData.password !== registerData.confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    if (!registerData.nickname) {
      setError('请输入昵称');
      return;
    }
    try {
      const res = await axios.post('/api/register', {
        username: registerData.username,
        password: registerData.password,
        nickname: registerData.nickname,
        address: registerData.address
      }, { withCredentials: true });
      setSuccess(res.data.message || '注册成功');
      setUser(registerData.username);
      await fetchUserProfile();
      // 注册后自动保存昵称和地址
      if (registerData.address) {
        try { await axios.post('/api/user/address', { address: registerData.address }, { withCredentials: true }); } catch {}
      }
    } catch (err) {
      let errorMsg = '注册失败';
      if (err && err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
    }
  };

  // 保存收货地址
  const handleSaveAddress = async () => {
    if (!address) return;
    setAddressLoading(true);
    try {
      await axios.post('/api/user/address', { address }, { withCredentials: true });
      setShowAddress(false);
    } catch {
      alert('保存失败');
    } finally {
      setAddressLoading(false);
    }
  };

  // 用户信息展示区
  const userInfo = user ? (
    <>
      <div className={styles['user-info']}>
        <div className={styles['user-avatar']} onClick={() => setShowEdit(true)} style={{cursor:'pointer'}}>
          <img src={avatarUrl} alt="avatar" />
          <div className={styles['edit-tip']} onClick={e => {e.stopPropagation();setShowEdit(true);}}>编辑资料</div>
        </div>
        <div className={styles['user-meta']}>
          <div className={styles['user-nickname']} title={nickname}>{nickname}</div>
          <div className={styles['user-account']}><span>账号：</span><span>{user}</span></div>
          <div className={styles['user-address']} onClick={() => setShowAddress(true)} style={{cursor:'pointer'}}>收货地址</div>
        </div>
      </div>
      <div className={styles['order-container']}>
        <div className={styles['order-title']}>我的订单</div>
        <div className={styles['order-info']}>
          <div className={styles['order-item']}><div className={styles['order-value']}>0</div><div className={styles['order-label']}>待付款</div></div>
          <div className={styles['order-item']}><div className={styles['order-value']}>0</div><div className={styles['order-label']}>待发货</div></div>
          <div className={styles['order-item']}><div className={styles['order-value']}>0</div><div className={styles['order-label']}>待收货</div></div>
          <div className={styles['order-item']}><div className={styles['order-value']}>6</div><div className={styles['order-label']}>待评价</div></div>
          <div className={styles['order-item']}><div className={styles['order-value']}>0</div><div className={styles['order-label']}>退款/售后</div></div>
        </div>
      </div>
    </>
  ) : null;

  // 收货地址弹窗
  const addressModal = showAddress && (
    <div className={styles['modal-mask']} onClick={()=>setShowAddress(false)}>
      <div className={styles['modal']} onClick={e=>e.stopPropagation()}>
        <div className={styles['modal-title']}>收货地址</div>
        <input className={styles['modal-input']} value={address} onChange={e=>setAddress(e.target.value)} placeholder="请输入收货地址" disabled={addressLoading} />
        <div className={styles['modal-actions']}>
          <button onClick={()=>setShowAddress(false)} disabled={addressLoading}>取消</button>
          <button onClick={handleSaveAddress} disabled={addressLoading}>保存</button>
        </div>
      </div>
    </div>
  );
  // 编辑资料弹窗
  const editModal = showEdit && (
    <div className={styles['modal-mask']} onClick={()=>setShowEdit(false)}>
      <div className={styles['modal']} onClick={e=>e.stopPropagation()}>
        <div className={styles['modal-title']}>编辑资料</div>
        <input className={styles['modal-input']} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="请输入昵称" />
        <div className={styles['modal-actions']}>
          <button onClick={()=>setShowEdit(false)}>取消</button>
          <button onClick={()=>setShowEdit(false)}>保存</button>
        </div>
      </div>
    </div>
  );

  // 登录后获取收货地址
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  return (
    <div className={styles['auth-container']}>
      {!user && <div className={styles['auth-title']}>账号登录 / 注册</div>}
      {userInfo}
      {addressModal}
      {editModal}
      {!user && (
        <>
          <div className={styles['auth-tabs']}>
            <div
              className={tab === 'login' ? `${styles['auth-tab']} ${styles['active']}` : styles['auth-tab']}
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
            >登录</div>
            <div
              className={tab === 'register' ? `${styles['auth-tab']} ${styles['active']}` : styles['auth-tab']}
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
            >注册</div>
          </div>
          {tab === 'login' ? (
            <form className={styles['auth-form']} onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="用户名"
                value={loginData.username}
                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="密码"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                autoComplete="current-password"
              />
              {error && <div className={styles['auth-error']}>{error}</div>}
              {success && <div className={styles['auth-success']}>{success}</div>}
              <button type="submit">登录</button>
            </form>
          ) : (
            <form className={styles['auth-form']} onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="用户名"
                value={registerData.username}
                onChange={e => setRegisterData({ ...registerData, username: e.target.value })}
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="密码"
                value={registerData.password}
                onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="确认密码"
                value={registerData.confirm}
                onChange={e => setRegisterData({ ...registerData, confirm: e.target.value })}
                autoComplete="new-password"
              />
              <input
                type="text"
                placeholder="昵称"
                value={registerData.nickname}
                onChange={e => setRegisterData({ ...registerData, nickname: e.target.value })}
                autoComplete="nickname"
              />
              <input
                type="text"
                placeholder="收货地址（可选）"
                value={registerData.address}
                onChange={e => setRegisterData({ ...registerData, address: e.target.value })}
                autoComplete="address"
              />
              {error && <div className={styles['auth-error']}>{error}</div>}
              {success && <div className={styles['auth-success']}>{success}</div>}
              <button type="submit">注册</button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default Auth;
