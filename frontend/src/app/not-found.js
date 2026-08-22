import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>404</h1>
      <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
        Страница не найдена
      </p>
      <Link href="/" className="btn btn-primary">
        Вернуться на главную
      </Link>
    </div>
  );
}