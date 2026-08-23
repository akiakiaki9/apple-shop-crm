import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/backend-api';
const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Перехватчик запросов для добавления CSRF токена
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    try {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    } catch (error) {
      console.error('Ошибка получения CSRF токена:', error);
    }
  }
  
  return config;
});

// Перехватчик ответов для обработки ошибок авторизации
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔒 Ошибка авторизации, перенаправление на логин...');
      // Проверяем, что мы не на странице логина
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Очищаем все куки
        document.cookie.split(';').forEach(cookie => {
          document.cookie = cookie
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });
        localStorage.removeItem('csrfToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;