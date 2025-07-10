import React, { useState, useEffect, useRef } from 'react';
import styles from './Auth.module.css';
import { useUser } from '../useUser.js';
import { useNavigate } from 'react-router-dom';

const defaultAvatarUrl = 'https://img.alicdn.com/sns_logo/i2/4018057314/O1CN0125ceLs23trpswnVHn_!!4018057314-0-userheaderimgshow.jpg';

const EditProfile = () => {
  const { user } = useUser();
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/profile', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setNickname(data.nickname || user);
        setAddress(data.address || '');
        setAvatar(data.avatar ? (data.avatar.startsWith('http') ? data.avatar : `/api${data.avatar}`) : defaultAvatarUrl);
      });
  }, [user]);

  const handleAvatarChange = e => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.avatar) {
        setAvatar(data.avatar.startsWith('http') ? data.avatar : `/api${data.avatar}`);
        setAvatarFile(null);
      } else {
        alert(data.message || '上传失败');
      }
    } catch {
      alert('上传失败');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    // 保存昵称
    await fetch('/api/user/nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nickname })
    });
    // 保存地址
    await fetch('/api/user/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ address })
    });
    setLoading(false);
    navigate('/profile');
  };

  if (!user) return <div className={styles['auth-container']}>请先登录</div>;

  return (
    <div className={styles['auth-container']}>
      <div className={styles['modal-title']}>编辑个人资料</div>
      <div className={styles['edit-profile-row']}>
        <div className={styles['edit-avatar-box']}>
          <div className={styles['user-avatar']} style={{margin:'0 auto',textAlign:'center'}}>
            {avatar && <img src={avatar} alt="avatar" style={{width:120,height:120,borderRadius:'50%',boxShadow:'0 0 12px #ddd'}} />}
          </div>
          <div style={{marginTop:18,textAlign:'center'}}>
            <input type="file" accept="image/*" style={{display:'none'}} ref={fileInputRef} onChange={handleAvatarChange} />
            <button className={styles['modal-btn']} onClick={()=>fileInputRef.current.click()} disabled={uploading}>选择头像</button>
            {avatarFile && <span style={{marginLeft:8,fontSize:13}}>{avatarFile.name}</span>}
            <button className={styles['modal-btn']} onClick={handleAvatarUpload} disabled={!avatarFile || uploading} style={{marginLeft:8}}>
              {uploading ? '上传中...' : '上传头像'}
            </button>
          </div>
        </div>
        <div className={styles['edit-info-box']}>
          <div style={{margin:'18px 0'}}>
            <label style={{display:'block',fontWeight:500,marginBottom:6}}>昵称</label>
            <input className={styles['modal-input']} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="请输入昵称" style={{width:'100%'}} />
          </div>
          <div style={{margin:'18px 0'}}>
            <label style={{display:'block',fontWeight:500,marginBottom:6}}>收货地址</label>
            <input className={styles['modal-input']} value={address} onChange={e=>setAddress(e.target.value)} placeholder="请输入收货地址" style={{width:'100%'}} />
          </div>
          <div className={styles['modal-actions']} style={{display:'flex',justifyContent:'space-between',marginTop:32}}>
            <button className={styles['modal-btn']} onClick={()=>navigate('/profile')} disabled={loading} style={{width:120}}>取消</button>
            <button className={styles['modal-btn']} onClick={handleSave} disabled={loading} style={{width:120,background:'#1677ff',color:'#fff'}}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
