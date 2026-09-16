import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export const PublicLayout = () => (
  <>
    <header className="topbar">
      <Link to="/" className="brand">Ruby</Link>
      <nav>
        <Link to="/how-it-works">How it works</Link>
        <Link to="/login">Login</Link>
        <Link to="/register" className="nav-cta">Register</Link>
      </nav>
    </header>
    <Outlet />
  </>
);
