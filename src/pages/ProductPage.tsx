import { useParams, useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { ProductCardProps, Product, mockProducts } from "./Product.tsx"

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [imageError, setImageError] = React.useState(false);

  const productId = id ? parseInt(id) : null;
  const product = mockProducts.find(p => p.id === productId);

  if (!product) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Товар не найден ( v _ v )</h1>
        <Link to="/" style={{ color: '#2c5aa0', textDecoration: 'none' }}>
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 16px',
          marginBottom: '20px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Назад
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '40px',
          justifyContent: 'center'
        }}>
          <div style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}>
            <div style={{
              width: '100%',
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              overflow: 'hidden',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px'
            }}>
              {!imageError ? (
                <img 
                  src={product.imageUrl} 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '16px'
                }}>
                  ( X o X )
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}>
            <h1 style={{ margin: '0 0 16px 0', fontSize: '28px' }}>
              {product.name}
            </h1>
            
            {product.category && (
              <p style={{ 
                color: '#666', 
                margin: '0 0 16px 0',
                fontSize: '16px'
              }}>
                Категория: {product.category}
              </p>
            )}

            <p style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#2c5aa0',
              margin: '0 0 20px 0'
            }}>
              {product.price.toLocaleString('ru-RU')} ₽
            </p>

            {product.description && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Описание</h3>
                <p style={{ lineHeight: '1.6' }}>{product.description}</p>
              </div>
            )}

            <button 
              style={{
                padding: '12px 24px',
                backgroundColor: '#2c5aa0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Добавить в желаемое
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;