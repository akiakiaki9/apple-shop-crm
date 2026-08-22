import Footer from '../../components/layout/footer/Footer';
import './globals.css';

export const metadata = {
  title: 'APPLE STORE - Учет товаров',
  description: 'Система учета мобильных телефонов по IMEI',
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <div className='main-container'>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}