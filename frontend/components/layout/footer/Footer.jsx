'use client';

import { FaHeart } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="footer-logo">📱</span>
                        <span className="footer-name">Телефонный магазин</span>
                    </div>

                    <div className="footer-divider"></div>

                    <div className="footer-info">
                        <span className="footer-text">
                            Разработано в
                            <a
                                href="https://www.akbarsoft.uz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-link"
                            >
                                Akbar Soft
                            </a>
                        </span>
                        <span className="footer-separator">•</span>
                        <span className="footer-year">{currentYear}</span>
                        <span className="footer-separator">•</span>
                        <span className="footer-text">Все права защищены</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}