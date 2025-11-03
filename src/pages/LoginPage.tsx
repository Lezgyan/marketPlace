import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import '../styles/LoginPage.css';


interface LoginPageProps {
  onSwitchToRegister: () => void;
  prefillEmail?: string; 
}

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  submit?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, prefillEmail = '' }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: prefillEmail, 
    password: ''
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (prefillEmail) {
      setFormData(prev => ({
        ...prev,
        email: prefillEmail
      }));
    }
  }, [prefillEmail]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccessMessage('Вход выполнен успешно! Добро пожаловать в агрегатор маркетплейсов!');
      
    } catch (error) {
      setErrors({ submit: 'Произошла ошибка при авторизации' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    onSwitchToRegister();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Вход в аккаунт</h1>
          <p>Агрегатор маркетплейсов</p>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="your@email.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Введите пароль"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading || !!successMessage}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Еще нет аккаунта?{' '}
            <a href="#" onClick={handleRegisterClick} className="register-link">
              Зарегистрироваться
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;