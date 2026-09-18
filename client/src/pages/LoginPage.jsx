import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  useEffect(() => {
    let active = true;

    api.get('/public-config')
      .then(({ data }) => {
        if (active) setShowDemoCredentials(Boolean(data.showDemoCredentials));
      })
      .catch(() => {
        if (active) setShowDemoCredentials(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
        <label>
          Password
          <span className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </span>
        </label>
        <button className="primary-button">Login</button>
        {showDemoCredentials && (
          <p className="muted">Demo password for seeded users: <strong>Password123!</strong></p>
        )}
      </form>
    </main>
  );
};
