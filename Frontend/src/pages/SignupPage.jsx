import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', adminKey: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signup(form);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-panel hero-panel hero-alt">
        <p className="eyebrow">Start your workspace</p>
        <h1>Create your account and become the first admin or team member.</h1>
        <p>
          The first account created in a fresh database is promoted to Admin automatically so you can bootstrap the team.
        </p>
      </section>

      <section className="auth-panel form-panel">
        <h2>Create account</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Taylor Jones" required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="taylor@company.com" required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" required />
          </label>
          <label>
            Admin Key (optional)
            <input type="password" value={form.adminKey} onChange={(event) => setForm({ ...form, adminKey: event.target.value })} placeholder="Enter admin key to create admin account" />
          </label>
          {error ? <div className="error-banner">{error}</div> : null}
          <button type="submit" className="button primary full-width" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}