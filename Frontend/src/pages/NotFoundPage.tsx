import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-number">404</div>
        <h1 className="not-found-title">Sayfa Bulunamadı</h1>
        <p className="not-found-message">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <button className="not-found-button" onClick={handleGoHome}>
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;

