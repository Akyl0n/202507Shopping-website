import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useUser } from '../useUser.js';

const Navbar = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const handleUserClick = (e) => {
    e.preventDefault();
    navigate(user ? '/profile' : '/auth');
  };
  return (
    <nav className="navbar">
      <div className="navbar-logo">电商商城</div>
      <ul className="navbar-links">
        <li><Link to="/">首页</Link></li>
        <li><Link to="/products">商品</Link></li>
        <li><Link to="/cart">购物车</Link></li>
        <li>
          <a href={user ? "/profile" : "/auth"} onClick={handleUserClick} style={{ color: '#fff', textDecoration: 'none', cursor: 'pointer' }}>
            {user ? `欢迎，${user}` : '登录/注册'}
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
