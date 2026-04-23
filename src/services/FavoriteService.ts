import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Product } from '../pages/Product';

interface Favorite {
  userId: number;
  productId: string;
}
// Функции, связанные с избранными товарами
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const navigate = useNavigate();

  const getUserId = (): number | null => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed.id || parsed.userId || null;
      } catch {
        return null;
      }
    }
    
    const savedUserId = "2";
    if (savedUserId) {
      return parseInt(savedUserId);
    }
    
    return null;
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const loadFavorites = async () => {
      const token = localStorage.getItem('authToken');
      const userId = getUserId();
      
      if (!token || !userId) {
        navigate('/login');
        return;
      }
  
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8080/products/favorite/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          const products = data.items || data.favorites || data || [];
          setFavorites(products);
          const ids = new Set(products.map((p: Product) => p.id));
          setFavoriteIds(ids);
        } else if (response.status === 401) {
          navigate('/login');
        } else {
          showNotification('Ошибка при загрузке избранного', 'error');
        }
      } catch (error) {
        showNotification('Ошибка сети при загрузке избранного', 'error');
      } finally {
        setLoading(false);
      }
    };

  const saveFavoritesToLocal = (products: Product[]) => {
    const currentUserId = getUserId();
    if (currentUserId) {
      localStorage.setItem(`favorites_${currentUserId}`, JSON.stringify(products));
    }
  };

  const addToFavorites = async (product: Product): Promise<boolean> => {
    const token = localStorage.getItem('authToken');
    const currentUserId = getUserId();
    
    if (!token || !currentUserId) {
      alert('Пожалуйста, войдите в систему');
      return false;
    }

    setLoading(true);
    try {
      const favorite: Favorite = {
        userId: currentUserId,
        productId: product.id
      };

      const response = await fetch('http://localhost:8080/products/favorite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(favorite),
      });

      if (response.ok) {
        setFavorites(prev => {
          const newFavorites = [...prev, product];
          saveFavoritesToLocal(newFavorites);
          return newFavorites;
        });
        setFavoriteIds(prev => new Set([...prev, product.id]));
        showNotification('Товар добавлен в избранное', 'success');
        return true;
      } else {
        const errorText = await response.text();
        showNotification('Ошибка сети при добавлении', 'error');
        return false;
      }
    } catch (error) {
      showNotification('Ошибка при добавлении', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (productId: string) => {
      const token = localStorage.getItem('authToken');
      const userId = getUserId();
      
      if (!token || !userId) {
        showNotification('Необходимо авторизоваться', 'error');
        return;
      }
  
      try {
        const response = await fetch('http://localhost:8080/products/unfavorite', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: userId, 
            productId: productId 
          }),
        });
  
        if (response.ok) {
            setFavorites(prev => prev.filter(p => p.id !== productId));
            setFavoriteIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
            showNotification('Товар удалён из избранного', 'success');
        } else {
            showNotification('Товар удалён из избранного', 'error'); //проблема с ответом на запросо, потом посмотреть
        }
      } catch (error) {
        showNotification('Ошибка сети при удалении', 'error');
      }
    };

  const isFavorite = (productId: string) => {
    return favoriteIds.has(productId);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return {
    favorites,
    loading,
    getUserId,
    showNotification,
    addToFavorites,
    removeFromFavorites,
    loadFavorites,
    isFavorite,
    refreshFavorites: loadFavorites,
  };
};