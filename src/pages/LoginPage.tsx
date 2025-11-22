import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import '../styles/LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/LoginService';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  prefillUsername?: string; 
}

interface LoginFormData {
  username: string; 
  password: string;
}

interface LoginErrors {
  username?: string; 
  password?: string;
  submit?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, prefillUsername = '' }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: prefillUsername, 
    password: ''
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (prefillUsername) {
      setFormData(prev => ({
        ...prev,
        username: prefillUsername 
      }));
    }
  }, [prefillUsername]);

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

    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать минимум 3 символа';
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
      const response = await loginUser({
        username: formData.username,
        password: formData.password
      });

      // Сохраняем токен и данные пользователя
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('username', formData.username); 
        
        if (response.user) {
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
      }

      setSuccessMessage('Вход выполнен успешно! Добро пожаловать в агрегатор маркетплейсов!');

      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error: any) {
      let errorMessage = 'Произошла ошибка при авторизации';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'Неверное имя пользователя или пароль'; 
      } else if (error.response?.status === 404) {
        errorMessage = 'Пользователь не найден';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Ошибка соединения с сервером';
      }
      
      setErrors({ submit: errorMessage });
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
            <label htmlFor="username">Имя пользователя</label> 
            <input
              type="text" 
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              placeholder="Ваше имя пользователя"
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
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