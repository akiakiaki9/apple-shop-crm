'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { API_BASE_URL } from '../../lib/api';
import {
  FaHome,
  FaBoxes,
  FaPlusCircle,
  FaMoneyBillWave,
  FaHistory,
  FaChartBar,
  FaSearch,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import './navigation/Navigation.css';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Закрытие меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Блокировка скролла при открытом меню
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { href: '/', label: 'Главная', icon: FaHome, shortLabel: 'Главная' },
    { href: '/inventory', label: 'Остатки', icon: FaBoxes, shortLabel: 'Остатки' },
    { href: '/purchases/new', label: 'Приход', icon: FaPlusCircle, shortLabel: 'Приход' },
    { href: '/sales/new', label: 'Продажа', icon: FaMoneyBillWave, shortLabel: 'Продажа' },
    { href: '/purchases', label: 'История', icon: FaHistory, shortLabel: 'История' },
    { href: '/analytics', label: 'Аналитика', icon: FaChartBar, shortLabel: 'Аналитика' },
    { href: '/imei', label: 'Поиск IMEI', icon: FaSearch, shortLabel: 'IMEI' },
  ];

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      setIsLoggingOut(true);
      try {
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];

        const response = await fetch(`${API_BASE_URL}/api-auth/logout/`, {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrfToken || '',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Logout failed: ${response.status}`);
        }

        router.push('/login');
        router.refresh();
      } catch (error) {
        console.error('Ошибка при выходе:', error);
      } finally {
        setIsLoggingOut(false);
        setIsMobileMenuOpen(false);
      }
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="container">
        <div className="nav-content">
          <div className="nav-brand">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="logo-wrapper">
                <Image
                  src="/images/logo.png"
                  alt="Телефонный магазин"
                  width={40}
                  height={40}
                  className="brand-logo"
                  priority
                />
              </div>
              <span className="brand-text">APPLE STORE</span>
              <span className="brand-text-short">AS</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={buttonRef}
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Navigation Links */}
          <ul
            ref={menuRef}
            className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}
            role="navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={isActive ? 'active' : ''}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-label-short">{item.shortLabel}</span>
                  </Link>
                </li>
              );
            })}
            <li className="logout-item">
              <button
                onClick={handleLogout}
                className="btn-logout"
                disabled={isLoggingOut}
              >
                <FaSignOutAlt className="nav-icon" />
                <span className="nav-label">{isLoggingOut ? 'Выход...' : 'Выйти'}</span>
                <span className="nav-label-short">{isLoggingOut ? '...' : 'Выйти'}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </nav>
  );
}