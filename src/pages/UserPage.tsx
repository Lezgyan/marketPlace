import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Product } from './Product';
import { useFavorites } from '../services/FavoriteService';

// Страница пользователя
const UserPage: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const navigate = useNavigate();
    const { 
    favorites, 
    loading, 
    removeFromFavorites, 
    loadFavorites
  } = useFavorites();
  
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {/* Уведомление */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: notification.type === 'success' ? '#4caf50' : '#f44336',
          color: 'white',
          borderRadius: '8px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {notification.message}
        </div>
      )}

      {/* Шапка */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>Мой профиль</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Здравствуйте, {username || 'пользователь'}!</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/">
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              На главную
            </button>
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
            Выйти
          </button>
        </div>
      </div>

      {/* Избранные товары */}
      <div>
        <h2 style={{ marginBottom: '20px' }}>
          ❤️ Избранные товары ({favorites.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #2c5aa0',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p>Загрузка избранных товаров...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '48px', marginBottom: '20px' }}>🤍</p>
            <p style={{ fontSize: '18px', marginBottom: '20px', color: '#666' }}>
              У вас пока нет избранных товаров
            </p>
            <Link to="/">
              <button style={{
                padding: '12px 24px',
                backgroundColor: '#2c5aa0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a6b'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c5aa0'}>
                Перейти к поиску
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {favorites.map(product => {
              const productData = product.dataRow;
              return (
                <div
                  key={product.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: 'white',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => navigate(`/product/${product.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromFavorites(product.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '18px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ❌
                  </button>

                  <div style={{
                    width: '100%',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px'
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
                      <div style={{ color: '#999', fontSize: '14px' }}>📷 Нет фото</div>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: '16px',
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
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#2c5aa0',
                    margin: '8px 0 0 0'
                  }}>
                    {productData.price?.toLocaleString('ru-RU') || '0'} {productData.currency || '₽'}
                  </p>

                  {/* Показываем первую характеристику, если есть */}
                  {productData.tags && productData.tags[0] && (
                    <div style={{
                      fontSize: '12px',
                      color: '#888',
                      marginTop: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {productData.tags[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserPage;