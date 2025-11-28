import { useParams, useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Product } from "./Product.tsx";

const useProduct = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getProductByID = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      const data = await response.json();
      setProduct(data);
      
    } catch (error) {
      console.error('Product fetch error:', error);
      setError('Не удалось загрузить товар');
    } finally {
      setLoading(false);
    }
  };
  
  return { product, getProductByID, loading, error };
};

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { product, getProductByID, loading, error } = useProduct();

  useEffect(() => {
    if (id) {
      getProductByID(id);
    }
  }, [id]);

  const getDynamicProperties = () => {
    if (!product?.dataRow) return [];

    const standardFields = [
      'id', 'url', 'name', 'tags', 'text', 'price', 'currency', 
      'fetched_at', 'picture_urls'
    ];

    return Object.entries(product.dataRow)
      .filter(([key]) => !standardFields.includes(key))
      .filter(([_, value]) => value !== null && value !== undefined && value !== '');
  };

  const dynamicProperties = getDynamicProperties();

  const nextImage = () => {
    if (product?.dataRow?.picture_urls) {
      setCurrentImageIndex(prev => 
        prev === product.dataRow.picture_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.dataRow?.picture_urls) {
      setCurrentImageIndex(prev => 
        prev === 0 ? product.dataRow.picture_urls.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Загрузка товара...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>{error}</h1>
        <Link to="/" style={{ color: '#2c5aa0', textDecoration: 'none' }}>
          Вернуться на главную
        </Link>
      </div>
    );
  }

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

  const productData = product.dataRow;
  const images = productData.picture_urls || [];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
          {/* Блок с изображениями */}
          <div style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}>
            {/* Основное изображение */}
            <div style={{
              position: 'relative',
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
              {images.length > 0 ? (
                <>
                  <img 
                    src={images[currentImageIndex]} 
                    alt={`${productData.name} - изображение ${currentImageIndex + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                  
                  {/* Кнопки навигации */}
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ‹
                      </button>
                      <button 
                        onClick={nextImage}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ›
                      </button>
                    </>
                  )}
                  
                  {/* Счетчик изображений */}
                  {images.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '14px'
                    }}>
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
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

            {/* Превью изображений */}
            {images.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '8px 0'
              }}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    style={{
                      width: '60px',
                      height: '60px',
                      border: index === currentImageIndex ? '2px solid #2c5aa0' : '1px solid #ddd',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0,
                      backgroundColor: '#f9f9f9'
                    }}
                  >
                    <img 
                      src={image} 
                      alt={`Превью ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Блок с информацией о товаре */}
          <div style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}>
            <h1 style={{ margin: '0 0 16px 0', fontSize: '28px' }}>
              {productData.name}
            </h1>
            
            {productData.tags && productData.tags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                {productData.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#f0f0f0',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginRight: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#2c5aa0',
              margin: '0 0 20px 0'
            }}>
              {productData.price?.toLocaleString('ru-RU')} {productData.currency || '₽'}
            </p>

            {productData.text && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Описание</h3>
                <p style={{ lineHeight: '1.6', color: '#333' }}>{productData.text}</p>
              </div>
            )}

            {/* Динамические характеристики */}
            {dynamicProperties.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Характеристики</h3>
                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {dynamicProperties.map(([key, value], index) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        padding: '12px 16px',
                        backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                        borderBottom: index === dynamicProperties.length - 1 ? 'none' : '1px solid #e0e0e0'
                      }}
                    >
                      <div style={{ 
                        flex: '1', 
                        fontWeight: '500',
                        color: '#555'
                      }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div style={{ 
                        flex: '1',
                        color: '#333'
                      }}>
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
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
                width: '100%',
                marginBottom: '15px'
              }}
            >
              Добавить в желаемое
            </button>

            {/* Дополнительная информация */}
            <div style={{ fontSize: '14px', color: '#666' }}>
              {productData.fetched_at && (
                <div style={{ marginBottom: '5px' }}>
                  Обновлено: {new Date(productData.fetched_at).toLocaleDateString('ru-RU')}
                </div>
              )}

              {productData.url && (
                <div>
                  <a 
                    href={productData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#2c5aa0', textDecoration: 'none' }}
                  >
                    Открыть оригинальную страницу →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;