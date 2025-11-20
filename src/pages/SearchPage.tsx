import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCardProps, Product, mockProducts } from './Product.tsx';

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    onProductClick(product);
  };

  return (
    <div 
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
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
        {product.name}
      </h3>
      <p style={{ 
        fontSize: '18px', 
        fontWeight: 'bold',
        color: '#2c5aa0',
        margin: '0'
      }}>
        {product.price.toLocaleString('ru-RU')} ₽
      </p>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [products] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const navigate = useNavigate();

  useEffect(() => {
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const handleLoginClick = () => {
    navigate(`/login`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
       <button 
        onClick={handleLoginClick}
        style={{
          padding: '8px 16px',
          marginBottom: '20px',
          backgroundColor: '#2652e4ff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          float: 'right',
          color: 'white'
        }}>
        
        Вход
      </button>

      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Поиск товаров</h1>
      
      <input
        type="text"
        placeholder="Введите название товара..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
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

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '15px'
      }}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onProductClick={handleProductClick}
            />
          ))
        ) : (
          <p style={{ textAlign: 'center', width: '100%' }}>Товары не найдены ( - _ - )</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;