import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './ProductList.module.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/products', { withCredentials: true })
      .then((res) => {
        const list = res.data.products || [];
        setProducts(list);
        // 提取所有类别并去重
        const cats = Array.from(new Set(list.map(p => p.category).filter(Boolean)));
        setCategories(['全部', ...cats]);
        setLoading(false);
      })
      .catch(() => {
        setError('获取商品失败');
        setLoading(false);
      });
  }, []);

  const filteredProducts = selectedCategory === '全部'
    ? products
    : products.filter(p => p.category === selectedCategory);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* 分类顶栏 */}
      <div className={styles['category-topbar']}>
        <div className={styles['category-topbar-scroll']}>
          {categories.map(cat => (
            <div
              key={cat}
              className={
                styles['category-item'] + (cat === selectedCategory ? ' ' + styles['category-item-active'] : '')
              }
              onClick={() => setSelectedCategory(cat)}
            >{cat}</div>
          ))}
        </div>
      </div>
      {/* 商品列表 */}
      <div className={styles['product-list-container']}>
        <div className={styles['product-list-grid']}>
          {filteredProducts.length === 0 ? (
            <div style={{textAlign:'center',color:'#888',fontSize:'1.1rem',width:'100%'}}>暂无商品</div>
          ) : (
            filteredProducts.map(p => (
              <div className={styles['product-card']} key={p.id} onClick={() => navigate(`/products/${p.id}`)} style={{cursor:'pointer'}}>
                <div className={styles['product-img-box']}>
                  <img
                    className={styles['product-img']}
                    src={
                      p.img
                        ? (p.img.startsWith('http') ? p.img : `https://img.alicdn.com/imgextra/i4/6000000000422/${p.img}`)
                        : 'https://via.placeholder.com/300x300?text=No+Image'
                    }
                    alt={p.title}
                  />
                </div>
                <div className={styles['product-title']} title={p.title}>{p.title}</div>
                <div className={styles['product-price']}>￥{p.price}</div>
                <div className={styles['product-sold']}>{p.stock || 0}件库存</div>
                <div className={styles['product-category']}>{p.category}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
