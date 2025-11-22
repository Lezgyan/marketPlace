import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';

const AppContent: React.FC = () => {
  const [prefillUsername, setPrefillUsername] = useState<string>(''); 
  const navigate = useNavigate();

  const handleSwitchToRegister = (): void => {
    navigate('/register');
  };

  const handleSwitchToLogin = (): void => {
    navigate('/login');
  };

  const handleRegistrationSuccess = (username: string): void => { 
    setPrefillUsername(username); 
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route 
        path="/login" 
        element={
          <LoginPage 
            onSwitchToRegister={handleSwitchToRegister}
            prefillUsername={prefillUsername} 
          />
        } 
      />
      <Route 
        path="/register" 
        element={
          <RegisterPage 
            onSwitchToLogin={handleSwitchToLogin}
            onRegistrationSuccess={handleRegistrationSuccess} 
          />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <AppContent />
      </div>
    </Router>
  );
};

export default App;