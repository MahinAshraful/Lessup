// src/components/Header.jsx
import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <h1>Lessup</h1>
      </div>
      <nav className="nav">
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">Library</a></li>
          <li><a href="#">About</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
