import React from 'react';
import './ProviderComponent.css';
import { useNavigate } from 'react-router';

const Provider: React.FC = () => {
  useNavigate()
  return (
    <div className="container">
      <div className="icon-container">
        <img
          src="https://module-federation.io/svg.svg"
          alt="logo"
          className="logo-image"
        />
      </div>
      <h1 className="title">Hello Module Federation 2.0</h1>
    </div>
  );
};

export default Provider;
