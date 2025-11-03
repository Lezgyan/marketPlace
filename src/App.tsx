import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';

type PageType = 'login' | 'register';

function App() {
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