import React, { useState, useEffect} from 'react';
import { useNavigate,useLocation, Link } from 'react-router-dom';
import { ProductCardProps, Product } from './Product.tsx';
import {useDynamicFilters, DynamicFilterPanel} from './DynamicFilter.tsx'
import { useProductSearch } from '../services/SearchService.tsx';

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    onProductClick(product);
  };

  const productData = product.dataRow;

  return (
    <div 
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '8px',
        margin: '8px',
        width: '250px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{
        width: '150px',
        height: '150px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
        overflow: 'hidden'
      }}>
        {!imageError && productData.picture_urls && productData.picture_urls[0] ? (
          <img 
            src={productData.picture_urls[0]} 
            alt={productData.name}
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
            fontSize: '14px'
          }}>
            (X o X)
          </div>
        )}
      </div>
      
      <h3 style={{ 
        margin: '0 0 8px 0',
        fontSize: '16px',
        textAlign: 'center',
        minHeight: '40px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {productData.name || 'Без названия'}
      </h3>
      
      {/* Показываем динамические характеристики под ценой */}
      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginTop: '8px',
        textAlign: 'center',
        maxHeight: '60px',
        overflow: 'hidden'
      }}>
        {Object.entries(productData)
          .filter(([key]) => !['id', 'url', 'name', 'tags', 'text', 'price', 'currency', 'fetched_at', 'picture_urls'].includes(key))
          .slice(0, 2)
          .map(([key, value]) => (
            <div key={key} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {key}: {value}
            </div>
          ))}
      </div>
      
      <p style={{ 
        fontSize: '18px', 
        fontWeight: 'bold',
        color: '#2c5aa0',
        margin: '8px 0 0 0'
      }}>
        {productData.price?.toLocaleString('ru-RU') || '0'} {productData.currency || '₽'}
      </p>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [username, setUsername] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [priceFrom, setPriceFrom] = useState<number>(0);
  const [priceTo, setPriceTo] = useState<number>(100000);
  const location = useLocation();
  const navigate = useNavigate();
  const { products, searchProducts, loading, saveSelectedFilters, loadSelectedFilters } = useProductSearch();
  
  // Получаем динамические фильтры из товаров
  const { filters: dynamicFilters } = useDynamicFilters(products);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    
    if (queryParam) {
      setSearchTerm(queryParam);
    }
    const token = localStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username');
    
    if (token && savedUsername) {
      setUsername(savedUsername);
    }
    
    const savedFilters = loadSelectedFilters();
    setSelectedFilters(savedFilters);
    
    // Восстанавливаем поисковый запрос
    const savedSearchTerm = localStorage.getItem('search_term');
    if (savedSearchTerm) {
      setSearchTerm(savedSearchTerm);
    }
    
    const savedPriceFrom = localStorage.getItem('price_from');
    const savedPriceTo = localStorage.getItem('price_to');
    if (savedPriceFrom) setPriceFrom(parseInt(savedPriceFrom));
    if (savedPriceTo) setPriceTo(parseInt(savedPriceTo));
    
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm, 0, priceFrom, priceTo, selectedFilters);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, priceFrom, priceTo, selectedFilters]);

  // Сохраняем выбранные фильтры при их изменении
  useEffect(() => {
    saveSelectedFilters(selectedFilters);
    localStorage.setItem('search_term', searchTerm);
    localStorage.setItem('price_from', priceFrom.toString());
    localStorage.setItem('price_to', priceTo.toString());
  }, [selectedFilters, searchTerm, priceFrom, priceTo]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const handleLoginClick = () => {
    navigate(`/login`);
  };

  const handleUserClick = () =>{
    navigate('/user');
  }
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userData');
    localStorage.removeItem('selected_filters');
    localStorage.removeItem('search_term');
    localStorage.removeItem('price_from');
    localStorage.removeItem('price_to');
    localStorage.removeItem('dynamic_filters_structure');
    setUsername(null);
    setSelectedFilters({});
    setSearchTerm('');
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Логотип и название */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#2c5aa0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🛒
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#2c5aa0' }}>MrktAgg()</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>агрегатор маркетплейсов</p>
              </div>
            </div>
          </Link>

          {/* Кнопка перехода на страницу поиска и профиль */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {username ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Link to="/user">
                  <span style={{
                    padding: '8px 16px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'inline-block'
                  }}>
                    👤 {username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2c5aa0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Поиск товаров</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Боковая панель с динамическими фильтрами */}
        <DynamicFilterPanel 
          filters={dynamicFilters}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          productCount={products.length}
        />
        
        {/* Основной контент */}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Введите название товара..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              marginBottom: '20px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />

          {/* Ценовой диапазон */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Цена от</label>
              <input
                type="number"
                value={priceFrom}
                onChange={(e) => setPriceFrom(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Цена до</label>
              <input
                type="number"
                value={priceTo}
                onChange={(e) => setPriceTo(parseInt(e.target.value) || 100000)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          {/* Активные фильтры */}
          {Object.entries(selectedFilters).filter(([_, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined && value !== '';
          }).length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px', 
              marginBottom: '20px',
              padding: '10px',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Активные фильтры:</span>
              {Object.entries(selectedFilters).map(([key, value]) => {
                if (Array.isArray(value)) {
                  return value.map(v => (
                    <span key={`${key}-${v}`} style={{
                      backgroundColor: '#2652e4',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {key}: {v}
                      <button
                        onClick={() => {
                          const newValue = value.filter((item: string) => item !== v);
                          handleFilterChange(key, newValue);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '0 4px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ));
                } else if (value && value !== null) {
                  return (
                    <span key={key} style={{
                      backgroundColor: '#2652e4',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {key}: {value}
                      <button
                        onClick={() => handleFilterChange(key, null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '0 4px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                }
                return null;
              })}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Загрузка товаров...</p>
            </div>
          )}

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '15px'
          }}>
            {!loading && products.length > 0 ? (
              products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onProductClick={handleProductClick}
                />
              ))
            ) : (
              !loading && (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px' }}>
                  <p>Товары не найдены ( - _ - )</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Попробуйте изменить параметры поиска или сбросить фильтры
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;