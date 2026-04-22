import React, { useState} from 'react';
import {Product } from '../pages/Product';

export const useProductSearch = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
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
      if (value === null || value === undefined) {
        return;
      }
      
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      
      if (typeof value === 'string' && value.trim() === '') {
        return;
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        const hasValidValue = Object.values(value).some(v => v !== null && v !== undefined && v !== '');
        if (!hasValidValue) {
          return;
        }
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
