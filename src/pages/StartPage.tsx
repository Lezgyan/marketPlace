import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import HorizontalScroll from './HorizontalScroll';
import { useRecommendations } from '../services/RecommendService';
import { useFavorites } from '../services/FavoriteService';

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { recommendations, loading: recLoading, loadRecommendations } = useRecommendations();
  const { favorites, loadFavorites } = useFavorites();

  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
    
    const initData = async () => {
      await loadFavorites();
      await loadRecommendations(20);
    };
    
    initData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    setUsername(null);
    navigate('/login');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#fafafa'
    }}>
      {/* Шапка */}
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

          {/* Поисковая строка */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '500px', margin: '0 20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#2c5aa0'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              />
              <button
                type="submit"
                style={{
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
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c5aa0'}
              >
                🔍 Найти
              </button>
            </div>
          </form>

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

      {/* Основной контент */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {/* Приветствие */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
            {username ? `Здравствуйте, ${username}!` : 'Добро пожаловать!'}
          </h2>
          <p style={{ color: '#666', fontSize: '16px' }}>
            {favorites.length > 0 
              ? `На основе ${favorites.length} товаров в избранном мы подобрали для вас рекомендации`
              : 'Добавьте товары в избранное, чтобы получать персональные рекомендации'}
          </p>
        </div>

        {/* Рекомендации */}
        <HorizontalScroll
          products={recommendations}
          title=''
          loading={recLoading}
        />
      </main>

      {/* Футер */}
      <footer style={{
        backgroundColor: 'white',
        borderTop: '1px solid #e0e0e0',
        padding: '24px 32px',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', color: '#666' }}>
          <p>Павлов Е., Денисов Д. 411; Лезгян А., Иванов А. 451</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;