import React, { useState } from 'react';
import styles from './Auth.module.css';
import axios from 'axios';
import { useUser } from '../useUser.js';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [tab, setTab] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', confirm: '', nickname: '', address: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setUser } = useUser();
  const navigate = useNavigate();

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
      navigate('/profile');
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
      navigate('/profile');
    } catch (err) {
      let errorMsg = '注册失败';
      if (err && err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
    }
  };

  return (
    <div className={styles['auth-container']}>
      <div className={styles['auth-title']}>账号登录 / 注册</div>
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
    </div>
  );
};

export default Auth;
