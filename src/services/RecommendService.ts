import { useState } from 'react';
import { Product } from '../pages/Product';

interface FavoriteQuery {
  userId: number;
  limit: number;
}

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecommendations = async (limit: number = 20) => {
    const token = localStorage.getItem('authToken');
    //const userId = localStorage.getItem('userId');
    const userId = '2';
    if (!token || !userId) {
      console.log('No token or userId, cannot load recommendations');
      return;
    }

    setLoading(true);
    try {
      const favoriteQuery: FavoriteQuery = {
        userId: userId,
        limit: limit
      };

      const response = await fetch('http://localhost:8080/products/recommend', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(favoriteQuery),
      });

      if (response.ok) {
        const data = await response.json();
        const products = data.items || data.recommendations || data || [];
        setRecommendations(products);
        console.log('Recommendations loaded:', products.length);
      } else {
        console.error('Failed to load recommendations:', response.status);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    recommendations,
    loading,
    loadRecommendations,
  };
};