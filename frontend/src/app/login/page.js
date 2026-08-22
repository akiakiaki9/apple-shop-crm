'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function fetchCSRFToken() {
    const response = await fetch(`${API_BASE_URL}/api-auth/csrf/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Не удалось получить CSRF токен');
    }

    const data = await response.json();
    return data.csrfToken;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await fetchCSRFToken();

      const response = await fetch(`${API_BASE_URL}/api-auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': token || '',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Неверный логин или пароль');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>📱 Телефонный магазин</h1>
          <p>Система учета по IMEI</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="login-footer">
          <small>Демо доступ: admin / admin123</small>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .login-container {
          background: white;
          padding: 40px 45px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          width: 100%;
          max-width: 420px;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 35px;
        }
        
        .login-header h1 {
          color: #1a1a2e;
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .login-header p {
          color: #6b7280;
          font-size: 14px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #374151;
          font-weight: 500;
          font-size: 14px;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 14px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.3s;
          background: #f9fafb;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
        
        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error-message {
          background: #fef2f2;
          color: #991b1b;
          padding: 12px 14px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          border: 1px solid #fecaca;
        }
        
        .btn-login {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        
        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .login-footer {
          text-align: center;
          margin-top: 20px;
          color: #9ca3af;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}