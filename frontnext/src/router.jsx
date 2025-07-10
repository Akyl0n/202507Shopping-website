import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import ProductReviews from './pages/ProductReviews.jsx';
import Cart from './pages/Cart.jsx';
import Auth from './pages/Auth.jsx';
import UserProfile from './pages/UserProfile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Order from './pages/Order.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderTab from './pages/OrderTab.jsx';
import OrderDetail from './pages/OrderDetail.jsx';

const AppRouter = () => (
  <BrowserRouter>
    <Navbar />
    <div className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/:id/reviews" element={<ProductReviews />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/UserProfile" element={<UserProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/order" element={<Order />}>
          <Route path="pending" element={<OrderTab label="待付款" />} />
          <Route path="toship" element={<OrderTab label="待发货" />} />
          <Route path="toreceive" element={<OrderTab label="待收货" />} />
          <Route path="toreview" element={<OrderTab label="待评价" />} />
          <Route path="refund" element={<OrderTab label="退款/售后" />} />
        </Route>
        <Route path="/order/detail/:id" element={<OrderDetail />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </div>
  </BrowserRouter>
);

export default AppRouter;
