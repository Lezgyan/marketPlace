import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';

type PageType = 'login' | 'register';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage/>} />
      </Routes>
    </Router>
  );
};

function App1() {
  const [currentPage, setCurrentPage] = useState<PageType>('login');
  const [prefillEmail, setPrefillEmail] = useState<string>('');

  const handleRegistrationSuccess = (email: string): void => {
    setPrefillEmail(email);
    setCurrentPage('login');
  };

  const renderPage = (): React.ReactElement => {
    switch (currentPage) {
      case 'register':
        return (
          <RegisterPage 
            onSwitchToLogin={() => setCurrentPage('login')}
            onRegistrationSuccess={handleRegistrationSuccess}
          />
        );
      case 'login':
      default:
        return (
          <LoginPage 
            onSwitchToRegister={() => setCurrentPage('register')}
            prefillEmail={prefillEmail}
          />
        );
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;