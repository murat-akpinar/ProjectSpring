import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../components/profile/UserProfile';
import './UserProfilePage.css';

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="user-profile-page">
      <div className="user-profile-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Anasayfaya Dön
        </button>
        <h1>Profilim</h1>
      </div>
      <UserProfile />
    </div>
  );
};

export default UserProfilePage;

