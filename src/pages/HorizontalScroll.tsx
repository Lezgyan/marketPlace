import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from './Product';

interface HorizontalScrollProps {
  products: Product[];
  title: string;
  loading?: boolean;
}

const HorizontalScroll: React.FC<HorizontalScrollProps> = ({ products, title, loading = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
        <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>{title}</h2>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: '220px',
                height: '280px',
                backgroundColor: '#f0f0f0',
                borderRadius: '12px',
                animation: 'pulse 1.5s ease-in-out infinite',
                flexShrink: 0
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>{title}</h2>
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          color: '#999'
        }}>
          <p style={{ fontSize: '14px', marginTop: '8px' }}> (￣︶￣) Чем больше товаров вы добавите, тем точнее будут рекомендации</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '40px', position: 'relative' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>{title}</h2>
      
      {/* Кнопки прокрутки */}
      {products.length > 4 && ( // вручную определил, вроде 4
        <>
          <button
            onClick={() => scroll('left')}
            style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            ‹
          </button>
          <button
            onClick={() => scroll('right')}
            style={{
              position: 'absolute',
              right: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            ›
          </button>
        </>
      )}
      
      {/* Горизонтальный скролл с карточками */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          padding: '8px 4px 16px 4px',
          scrollbarWidth: 'thin',
          msOverflowStyle: 'auto'
        }}
      >
        {products.map((product) => {
          const productData = product.dataRow;
          return (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              style={{
                flex: '0 0 auto',
                width: '220px',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{
                width: '100%',
                height: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                overflow: 'hidden',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px'
              }}>
                {productData.picture_urls && productData.picture_urls[0] ? (
                  <img
                    src={productData.picture_urls[0]}
                    alt={productData.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div style={{ color: '#999', fontSize: '32px' }}>📷</div>
                )}
              </div>
              
              <h3 style={{
                fontSize: '14px',
                margin: '0 0 8px 0',
                minHeight: '40px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                color: '#333'
              }}>
                {productData.name}
              </h3>
              
              <p style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#2c5aa0',
                margin: 0
              }}>
                {productData.price?.toLocaleString('ru-RU') || '0'} {productData.currency || '₽'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalScroll;