import React from 'react';
import styles from './Home.module.css';

const Home = () => {
  return (
    <div className={styles.home}>
      <h1 className={styles['home-title']}>欢迎来到电商商城</h1>
      <p className={styles['home-desc']}>
        这里有丰富的商品、便捷的购物体验和安全的支付环境。
      </p>
    </div>
  );
};

export default Home;
