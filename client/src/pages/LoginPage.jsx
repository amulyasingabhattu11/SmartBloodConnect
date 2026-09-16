import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiErrorMessage } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/app');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Login</h1>
        {error && <div className="form-error">{error}</div>}
        <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="primary-button">Login</button>
        <p className="muted">Demo password for seeded users: <strong>Password123!</strong></p>
      </form>
    </main>
  );
};
