import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ProductDetail.module.css';
import { useUser } from '../useUser.js';
import { useCart } from '../store.jsx';

const defaultImgs = [
  'https://img.alicdn.com/imgextra/i4/6000000000422/O1CN01Qw2QwB1CkQwZ0pQwB_!!6000000000422-0-tbvideo.jpg',
  'https://img.alicdn.com/imgextra/i2/2200700000000/O1CN01EarPods.jpg',
  'https://img.alicdn.com/imgextra/i3/2200700000000/O1CN01Keyboard.jpg',
];

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useUser();
  const { setCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState('');
  const [qty, setQty] = useState(1);
  const [showModelModal, setShowModelModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setProduct(data);
          if (data.models && data.models.length > 0) {
            setSelectedModel(data.models[0].name || data.models[0]);
          }
        } else {
          setError('未找到该商品');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('获取商品失败');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/profile', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAddress(data.address || '未设置'))
      .catch(() => setAddress('未设置'));
  }, [user]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div style={{color:'#e53935'}}>{error}</div>;
  if (!product) return null;

  // 处理图片数组
  const imgs = product.imgs && product.imgs.length > 0 ? product.imgs : [defaultImgs[0]];
  // 价格处理
  const minPrice = product.models && product.models.length > 0 ? Math.min(...product.models.map(m => m.price)) : product.price;
  // 型号处理
  const models = product.models && product.models.length > 0 ? product.models.map(m => m.name) : [product.model || '默认型号'];

  // 购买数量限制
  const handleQtyChange = (v) => {
    if (v < 1) setQty(1);
    else setQty(v);
  };

  // 加入购物车
  const handleAddToCart = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    if (!selectedModel) {
      alert('请选择型号');
      return;
    }
    // 找到 model_id
    const modelObj = product.models.find(m => m.name === selectedModel);
    if (!modelObj) {
      alert('型号信息有误');
      return;
    }
    const body = {
      product_id: product.id,
      model_id: modelObj.id,
      qty: qty
    };
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        alert('已加入购物车');
        fetch('/api/cart', { credentials: 'include' })
          .then(r => r.json())
          .then(list => setCart(Array.isArray(list) ? list : (list.items || [])));
      } else {
        alert(data.error || '加入购物车失败');
      }
    } catch {
      alert('网络错误，加入购物车失败');
    }
  };

  // 立即购买
  const handleBuyNow = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    if (!selectedModel) {
      alert('请选择型号');
      return;
    }
    // 找到 model_id
    const modelObj = product.models.find(m => m.name === selectedModel);
    if (!modelObj) {
      alert('型号信息有误');
      return;
    }
    // 获取用户地址
    let address = '';
    try {
      const res = await fetch('/api/user/address', { credentials: 'include' });
      const data = await res.json();
      if (data && data.address) address = data.address;
    } catch {
      //
    }
    // 构造下单数据
    const items = [{
      product_id: product.id,
      model_id: modelObj.id,
      quantity: qty,
      price: modelObj.price
    }];
    const total = modelObj.price * qty;
    // 提交订单
    try {
      const res = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, address, total })
      });
      const data = await res.json();
      if (res.ok && data.order_id) {
        window.location.href = `/checkout?orderId=${data.order_id}`;
      } else {
        alert(data.error || '下单失败');
      }
    } catch {
      alert('下单异常');
    }
  };

  return (
    <div className={styles['product-detail-container']}>
      <div className={styles['product-detail-main']}>
        <div className={styles['product-detail-imgs']}>
          <img className={styles['product-detail-img']} src={imgs[imgIndex]} alt={product.title} />
          {imgs.length > 1 && (
            <div className={styles['product-detail-img-thumbs']}>
              {imgs.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={product.title + '-' + idx}
                  className={imgIndex === idx ? styles['active'] : ''}
                  onClick={() => setImgIndex(idx)}
                  style={{width:48,height:48,objectFit:'cover',borderRadius:6,marginRight:8,cursor:'pointer',border:imgIndex===idx?'2px solid #1976d2':'2px solid #eee'}}
                />
              ))}
            </div>
          )}
        </div>
        <div className={styles['product-detail-info']}>
          <div className={styles['product-detail-title']}>{product.title}</div>
          <div style={{fontSize:'1.08rem',color:'#666',margin:'2px 0 2px 0',lineHeight:1.6}}>{product.description}</div>
          <div className={styles['product-detail-row']}>
            <span className={styles['product-detail-price']}>￥{minPrice}</span>
            <span className={styles['product-detail-sold']}>{product.sold || 0}人已购买</span>
          </div>
          <div className={styles['product-detail-row']}>
            配送至 <span className={styles['product-detail-address']}>{address}</span>
          </div>
          <div className={styles['product-detail-row']}>
            型号分类：
            <div className={styles['product-detail-models']}>
              {models.slice(0, 3).map(m => (
                <span
                  key={m}
                  className={selectedModel === m ? styles['model-active'] : styles['model']}
                  style={{cursor:'pointer'}}
                  onClick={() => setShowModelModal(true)}
                >{m}</span>
              ))}
            </div>
          </div>
          <div className={styles['product-detail-row']} style={{alignItems:'center'}}>
            购买数量：
            <button className={styles['qty-btn']} style={{display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => handleQtyChange(qty-1)} disabled={qty<=1}>
              <span style={{display:'inline-block',width:18,textAlign:'center'}}>-</span>
            </button>
            <input className={styles['qty-input']} type="number" min={1} value={qty} onChange={e => handleQtyChange(Number(e.target.value))} />
            <button className={styles['qty-btn']} style={{display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => handleQtyChange(qty+1)}>
              <span style={{display:'inline-block',width:18,textAlign:'center'}}>+</span>
            </button>
          </div>
          <div className={styles['product-detail-actions']}>
            <button className={styles['buy-btn']} onClick={handleBuyNow}>立即购买</button>
            <button className={styles['cart-btn']} onClick={handleAddToCart}>加入购物车</button>
          </div>
        </div>
      </div>
      {/* 型号选择弹窗 */}
      {showModelModal && (
        <div style={{position:'fixed',left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:99,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowModelModal(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:32,minWidth:260,boxShadow:'0 2px 16px #ccc'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:'bold',fontSize:'1.1rem',marginBottom:18}}>选择型号</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {models.map(m => (
                <span
                  key={m}
                  style={{padding:'8px 0',borderBottom:'1px solid #f0f0f0',cursor:'pointer',color:selectedModel===m?'#1976d2':'#222',fontWeight:selectedModel===m?'bold':'normal'}}
                  onClick={()=>{setSelectedModel(m);setShowModelModal(false);}}
                >{m}</span>
              ))}
            </div>
            <button style={{marginTop:18,background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 24px',fontSize:'1rem',cursor:'pointer'}} onClick={()=>setShowModelModal(false)}>取消</button>
          </div>
        </div>
      )}
      {/* 评论区 */}
      <div style={{marginTop:48,padding:'0 24px'}}>
        <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:18}}>商品评价</div>
        {product.reviews && product.reviews.length > 0 ? (
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            {product.reviews.map((review, idx) => (
              <div key={idx} style={{background:'#fafbfc',borderRadius:8,padding:'16px 18px',boxShadow:'0 1px 4px #f3f3f3'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
                  <span style={{fontWeight:500,color:'#1976d2'}}>{review.username}</span>
                  <span style={{color:'#ffb400',fontSize:'1.1rem'}}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                  <span style={{color:'#888',fontSize:13}}>{review.created_at ? (typeof review.created_at === 'string' ? review.created_at.slice(0,10) : '') : ''}</span>
                  {review.model_id && product.models && product.models.length > 0 && (
                    <span style={{marginLeft:8,color:'#888',fontSize:13}}>
                      {(() => {
                        const m = product.models.find(m => m.id === review.model_id);
                        return m ? m.name : '';
                      })()}
                    </span>
                  )}
                </div>
                <div style={{color:'#222',fontSize:'1.05rem',lineHeight:1.7}}>{review.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{color:'#888',fontSize:'1rem',padding:'24px 0'}}>暂无评价</div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
