import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCardProps, Product } from './Product.tsx';

// Динамические фильтры
interface DynamicFilter {
  key: string;          
  label: string;         
  type: 'checkbox' | 'radio';
  options: string[]; 
}

export const useDynamicFilters = (products: Product[]) => {
  const [filters, setFilters] = useState<DynamicFilter[]>([]);
  
  useEffect(() => {
    const dynamicFieldsMap = new Map<string, Set<string>>();
    
    products.forEach(product => {
      const dataRow = product.dataRow;
      
      Object.entries(dataRow).forEach(([key, value]) => {
        const excludedKeys = ['id', 'url', 'name', 'tags', 'text', 'price', 'currency', 'fetched_at', 'picture_urls'];
        
        if (!excludedKeys.includes(key) && value && typeof value === 'string' && value.trim() !== '') {
          if (!dynamicFieldsMap.has(key)) {
            dynamicFieldsMap.set(key, new Set());
          }
          dynamicFieldsMap.get(key)!.add(value);
        }
      });
    });
    
    const newFilters: DynamicFilter[] = Array.from(dynamicFieldsMap.entries()).map(([key, values]) => {
      const options = Array.from(values).sort();
      
      const type = options.length <= 5 ? 'radio' : 'checkbox';
      
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
    
    if (newFilters.length > 0) {
      localStorage.setItem('dynamic_filters_structure', JSON.stringify(newFilters));
    }
    
  }, [products]);
  
  const getCachedFilters = (): DynamicFilter[] => {
    const cached = localStorage.getItem('dynamic_filters_structure');
    return cached ? JSON.parse(cached) : [];
  };
  
  return { filters, cachedFilters: getCachedFilters() };
};

export const DynamicFilterPanel: React.FC<{
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
      
    </div>
  );
};