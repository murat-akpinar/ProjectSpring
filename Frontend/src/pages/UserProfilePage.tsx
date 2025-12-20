import React from 'react';
import UserProfile from '../components/profile/UserProfile';
import './UserProfilePage.css';

const UserProfilePage: React.FC = () => {
  return (
    <div className="user-profile-page">
      <h1>Profilim</h1>
      <UserProfile />
    </div>
  );
};

export default UserProfilePage;

