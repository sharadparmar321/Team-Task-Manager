import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-panel hero-panel">
        <p className="eyebrow">Work faster</p>
        <h1>Manage projects, tasks, and team progress without the noise.</h1>
        <p>
          Track what matters, assign clearly, and keep delivery moving with a focused command center.
        </p>
      </section>

      <section className="auth-panel form-panel">
        <h2>Sign in</h2>
        <p>Use the demo admin account or your own user credentials.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@teamtask.local" required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" required />
          </label>
          {error ? <div className="error-banner">{error}</div> : null}
          <button type="submit" className="button primary full-width" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </div>
  );
}