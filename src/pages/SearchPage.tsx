import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCardProps, Product } from './Product.tsx';

// Тип для динамического фильтра
interface DynamicFilter {
  key: string;           // Например: "Вес", "Стабилизация", "Цвет"
  label: string;         // Отображаемое имя
  type: 'checkbox' | 'radio';
  options: string[];     // Уникальные значения из товаров
}

const useProductSearch = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Сохранение выбранных фильтров
  const saveSelectedFilters = (selected: Record<string, any>) => {
    localStorage.setItem('selected_filters', JSON.stringify(selected));
  };

  const loadSelectedFilters = (): Record<string, any> => {
    const saved = localStorage.getItem('selected_filters');
    return saved ? JSON.parse(saved) : {};
  };

  const searchProducts = async (
    query: string, 
    numberOfPage: number = 10, 
    priceFrom: number = 0, 
    priceTo: number = 100000, 
    selectedFilters: Record<string, any> = {}
  ) => {
    setLoading(true);

    const cleanPayload = () => {
      const cleaned: Record<string, any> = {};
    
      Object.entries(selectedFilters).forEach(([key, value]) => {
      // Пропускаем null и undefined
      if (value === null || value === undefined) {
        return;
      }
      
      // Пропускаем пустые массивы
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      
      // Пропускаем пустые строки
      if (typeof value === 'string' && value.trim() === '') {
        return;
      }
    // Для объектов (например, диапазон цены) проверяем, что хоть одно значение не пустое
      if (typeof value === 'object' && !Array.isArray(value)) {
        const hasValidValue = Object.values(value).some(v => v !== null && v !== undefined && v !== '');
        if (!hasValidValue) {
          return;
        }
        // Очищаем внутренние пустые значения объекта
        const cleanedObject: Record<string, any> = {};
        Object.entries(value).forEach(([objKey, objValue]) => {
          if (objValue !== null && objValue !== undefined && objValue !== '') {
            cleanedObject[objKey] = objValue;
          }
        });
        if (Object.keys(cleanedObject).length > 0) {
          cleaned[key] = cleanedObject;
        }
        return;
      }
      
      // Все остальные валидные значения добавляем
      cleaned[key] = value;
    });
    
    return cleaned;
  };
  
  const finalPayload = cleanPayload();

    try {
      const response = await fetch('http://localhost:8080/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query, 
          numberOfPage, 
          priceFrom, 
          priceTo, 
          payload: finalPayload,
        })
      });
      
      const data = await response.json();
      
      // Извлекаем товары (поддержка разных форматов ответа)
      let productsData: Product[] = [];
      if (data.items && Array.isArray(data.items)) {
        productsData = data.items;
      } else if (Array.isArray(data)) {
        productsData = data;
      } else if (data.products && Array.isArray(data.products)) {
        productsData = data.products;
      }
      
      setProducts(productsData);
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { 
    products, 
    searchProducts, 
    loading,
    saveSelectedFilters,
    loadSelectedFilters
  };
};

// Хук для извлечения динамических фильтров из товаров
const useDynamicFilters = (products: Product[]) => {
  const [filters, setFilters] = useState<DynamicFilter[]>([]);
  
  useEffect(() => {
    // Собираем все динамические характеристики из всех товаров
    const dynamicFieldsMap = new Map<string, Set<string>>();
    
    products.forEach(product => {
      const dataRow = product.dataRow;
      
      // Перебираем все ключи в dataRow
      Object.entries(dataRow).forEach(([key, value]) => {
        // Исключаем стандартные поля, которые не нужны для фильтрации
        const excludedKeys = ['id', 'url', 'name', 'tags', 'text', 'price', 'currency', 'fetched_at', 'picture_urls'];
        
        if (!excludedKeys.includes(key) && value && typeof value === 'string' && value.trim() !== '') {
          if (!dynamicFieldsMap.has(key)) {
            dynamicFieldsMap.set(key, new Set());
          }
          dynamicFieldsMap.get(key)!.add(value);
        }
      });
    });
    
    // Преобразуем в массив фильтров
    const newFilters: DynamicFilter[] = Array.from(dynamicFieldsMap.entries()).map(([key, values]) => {
      const options = Array.from(values).sort();
      
      // Определяем тип: если опций мало (до 5) - radio, иначе checkbox
      const type = options.length <= 5 ? 'radio' : 'checkbox';
      
      // Создаём понятный label
      let label = key;
      const labelMap: Record<string, string> = {
        'Вес': 'Вес (г)',
        'Стабилизация': 'Стабилизация',
        'Цвет': 'Цвет',
        'Размер': 'Размер',
        'Материал': 'Материал',
        'Бренд': 'Бренд'
      };
      label = labelMap[key] || key;
      
      return { key, label, type, options };
    });
    
    setFilters(newFilters);
    
    // Сохраняем структуру фильтров в localStorage для кэширования
    if (newFilters.length > 0) {
      localStorage.setItem('dynamic_filters_structure', JSON.stringify(newFilters));
    }
    
  }, [products]);
  
  // Загружаем сохранённую структуру фильтров, если товаров пока нет
  const getCachedFilters = (): DynamicFilter[] => {
    const cached = localStorage.getItem('dynamic_filters_structure');
    return cached ? JSON.parse(cached) : [];
  };
  
  return { filters, cachedFilters: getCachedFilters() };
};

// Компонент панели динамических фильтров
const DynamicFilterPanel: React.FC<{
  filters: DynamicFilter[];
  selectedFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  productCount: number;
}> = ({ filters, selectedFilters, onFilterChange, productCount }) => {
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

  const toggleFilter = (key: string) => {
    setExpandedFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (filters.length === 0) {
    return (
      <div style={{ 
        width: '280px', 
        padding: '20px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px',
        textAlign: 'center',
        color: '#999'
      }}>
        <p>Нет доступных фильтров</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          Фильтры появятся после загрузки товаров
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '280px', 
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      position: 'sticky',
      top: '20px',
      height: 'fit-content',
      maxHeight: 'calc(100vh - 40px)',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Фильтры</h3>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {productCount} товаров
        </span>
      </div>
      
      {filters.map(filter => {
        const selectedValue = selectedFilters[filter.key];
        const hasSelection = filter.type === 'checkbox' 
          ? (selectedValue?.length > 0)
          : (selectedValue !== null && selectedValue !== undefined);
        
        return (
          <div key={filter.key} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <div 
              onClick={() => toggleFilter(filter.key)}
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: hasSelection ? 'bold' : 'normal',
                color: hasSelection ? '#2652e4' : 'inherit'
              }}
            >
              <span>{filter.label}</span>
              <div>
                {hasSelection && (
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      onFilterChange(filter.key, filter.type === 'checkbox' ? [] : null);
                    }}
                    style={{ 
                      fontSize: '12px', 
                      color: '#ff4444', 
                      marginRight: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </span>
                )}
                <span>{expandedFilters[filter.key] !== false ? '▼' : '▶'}</span>
              </div>
            </div>
            
            {expandedFilters[filter.key] !== false && (
              <div style={{ marginLeft: '10px', marginTop: '10px' }}>
                {filter.type === 'checkbox' && (
                  <div>
                    {filter.options.map(option => (
                      <label key={option} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedValue?.includes(option) || false}
                          onChange={(e) => {
                            const current = selectedValue || [];
                            let newValue;
                            if (e.target.checked) {
                              newValue = [...current, option];
                            } else {
                              newValue = current.filter((v: string) => v !== option);
                            }
                            onFilterChange(filter.key, newValue);
                          }}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px' }}>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {filter.type === 'radio' && (
                  <div>
                    {filter.options.map(option => (
                      <label key={option} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={filter.key}
                          checked={selectedValue === option}
                          onChange={() => onFilterChange(filter.key, option)}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px' }}>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      <button
        onClick={() => {
          filters.forEach(filter => {
            onFilterChange(filter.key, filter.type === 'checkbox' ? [] : null);
          });
        }}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
      >
        Сбросить все фильтры
      </button>
    </div>
  );
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
            📷 Нет фото
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
  
  const navigate = useNavigate();
  const { products, searchProducts, loading, saveSelectedFilters, loadSelectedFilters } = useProductSearch();
  
  // Получаем динамические фильтры из товаров
  const { filters: dynamicFilters } = useDynamicFilters(products);

  // Загрузка сохранённых фильтров при монтировании
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username');
    
    if (token && savedUsername) {
      setUsername(savedUsername);
    }
    
    // Восстанавливаем выбранные фильтры
    const savedFilters = loadSelectedFilters();
    setSelectedFilters(savedFilters);
    
    // Восстанавливаем поисковый запрос
    const savedSearchTerm = localStorage.getItem('search_term');
    if (savedSearchTerm) {
      setSearchTerm(savedSearchTerm);
    }
    
    // Восстанавливаем ценовой диапазон
    const savedPriceFrom = localStorage.getItem('price_from');
    const savedPriceTo = localStorage.getItem('price_to');
    if (savedPriceFrom) setPriceFrom(parseInt(savedPriceFrom));
    if (savedPriceTo) setPriceTo(parseInt(savedPriceTo));
    
  }, []);

  // Выполняем поиск при изменении параметров
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

          {/* Активные фильтры (чипсы) */}
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