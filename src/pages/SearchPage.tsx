import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCardProps, Product} from './Product.tsx';

const useProductSearch = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const searchProducts = async (query: string, numberOfPage: number = 10, priceFrom: number = 0, priceTo: number = 100000, payload: [key: string, value:string ]) => {
    setLoading(true);
    payload = {"Вес": "42 г"};
    try {
      const response = await fetch('http://localhost:8080/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, numberOfPage, priceFrom, priceTo, payload})
      });
      
      const data = await response.json();
      
      setProducts(data.items || data || []);
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { products, searchProducts, loading };
};

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
            ( X o X )
          </div>
        )}
      </div>
      
      <h3 style={{ 
        margin: '0 0 8px 0',
        fontSize: '16px',
        textAlign: 'center',
        minHeight: '40px'
      }}>
        {productData.name}
      </h3>
      <p style={{ 
        fontSize: '18px', 
        fontWeight: 'bold',
        color: '#2c5aa0',
        margin: '0'
      }}>
        {productData.price?.toLocaleString('ru-RU')} {productData.currency || '₽'}
      </p>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();
  const { products, searchProducts, loading } = useProductSearch();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username');
    
    if (token && savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchProducts(value, 0, 0, 10001, {"Стабилизация": "белый"}); 
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const handleLoginClick = () => {
    navigate(`/login`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userData');
    setUsername(null);
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        {username ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              👤 {username}
            </span>
            <button 
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Выйти
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLoginClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2652e4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Вход
          </button>
        )}
      </div>

      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Поиск товаров</h1>
      
      <input
        type="text"
        placeholder="Введите название товара..."
        value={searchTerm}
        onChange={handleSearchChange}
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '12px',
          fontSize: '16px',
          marginBottom: '20px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      />

      {loading && <p style={{ textAlign: 'center' }}>Загрузка...</p>}

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
          !loading && <p style={{ textAlign: 'center', width: '100%' }}>Товары не найдены ( - _ - )</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;