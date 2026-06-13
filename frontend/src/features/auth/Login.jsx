import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setApiError('');
    try {
      const res = await authApi.login(form);
      setAuth(res.data.user, res.data.token);
      navigate('/voice/setup');
    } catch (err) {
      setApiError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: 'var(--space-lg)',
    }}>
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🧠</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Sign in to continue your wellness journey
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            {apiError && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
                {apiError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`form-input${errors.email ? ' border-danger' : ''}`}
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="form-error">⚠ {errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className={`form-input${errors.password ? ' border-danger' : ''}`}
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && <span className="form-error">⚠ {errors.password}</span>}
              </div>

              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={isLoading}
                style={{ marginTop: 'var(--space-sm)' }}
              >
                {isLoading ? (
                  <><div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in...</>
                ) : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
