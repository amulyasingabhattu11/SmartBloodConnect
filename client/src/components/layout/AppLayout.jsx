import React from 'react';
import { Bell, HeartPulse, LayoutDashboard, LogOut, Shield, UserRoundPlus } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/app" className="brand brand-sidebar">Ruby</Link>
        <nav className="side-nav">
          <NavLink to="/app"><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/app/requests/new"><HeartPulse size={18} /> Request Blood</NavLink>
          <NavLink to="/app/requests"><HeartPulse size={18} /> My Requests</NavLink>
          <NavLink to="/app/donor"><UserRoundPlus size={18} /> Donor Profile</NavLink>
          <NavLink to="/app/notifications"><Bell size={18} /> Notifications</NavLink>
          {user?.role === 'ADMIN' && <NavLink to="/app/admin"><Shield size={18} /> Admin</NavLink>}
        </nav>
        <button className="icon-text-button" onClick={signOut}><LogOut size={18} /> Logout</button>
      </aside>
      <main className="content">
        <div className="content-header">
          <div>
            <p className="eyebrow">Emergency coordination</p>
            <h1>Welcome, {user?.name}</h1>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};
