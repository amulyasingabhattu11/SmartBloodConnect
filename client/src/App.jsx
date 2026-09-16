import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { PublicLayout } from './components/layout/PublicLayout.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { DonorProfilePage } from './pages/DonorProfilePage.jsx';
import { CreateRequestPage } from './pages/CreateRequestPage.jsx';
import { MyRequestsPage } from './pages/MyRequestsPage.jsx';
import { RequestDetailsPage } from './pages/RequestDetailsPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { HowItWorksPage } from './pages/HowItWorksPage.jsx';

const Protected = ({ children }) => {
  const { isAuthed, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading Ruby...</div>;
  return isAuthed ? children : <Navigate to="/login" replace />;
};

export const App = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>
    <Route path="/app" element={<Protected><AppLayout /></Protected>}>
      <Route index element={<DashboardPage />} />
      <Route path="donor" element={<DonorProfilePage />} />
      <Route path="requests/new" element={<CreateRequestPage />} />
      <Route path="requests" element={<MyRequestsPage />} />
      <Route path="requests/:id" element={<RequestDetailsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="admin" element={<AdminPage />} />
    </Route>
  </Routes>
);
