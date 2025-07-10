import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ProductReviews = () => {
  const { id } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}/reviews`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch(() => {
        setError('获取评论失败');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div style={{color:'#e53935'}}>{error}</div>;

  return (
    <div style={{maxWidth:700,margin:'32px auto',background:'#fff',borderRadius:12,boxShadow:'0 2px 12px #eee',padding:'32px 24px'}}>
      <div style={{fontWeight:'bold',fontSize:'1.3rem',marginBottom:18}}>商品评价</div>
      {reviews.length > 0 ? (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          {reviews.map((review, idx) => (
            <div key={idx} style={{background:'#fafbfc',borderRadius:8,padding:'16px 18px',boxShadow:'0 1px 4px #f3f3f3'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
                <span style={{fontWeight:500,color:'#1976d2'}}>{review.username}</span>
                <span style={{color:'#ffb400',fontSize:'1.1rem'}}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                <span style={{color:'#888',fontSize:13}}>{review.created_at ? (typeof review.created_at === 'string' ? review.created_at.slice(0,10) : '') : ''}</span>
                {review.model_id && (
                  <span style={{marginLeft:8,color:'#888',fontSize:13}}>
                    型号ID: {review.model_id}
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
  );
};

export default ProductReviews;
