import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../services/api.js';

function LoginPage({ onAuthSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authResponse = await api.login(form);
      onAuthSuccess(authResponse);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <PageHeader
        eyebrow="Account access"
        title="Login"
        description="Access CityFix with your registered account."
      />

      {error && <ErrorState message={error} />}

      <form className="panel auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>

        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} required />
        </label>

        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <p className="auth-switch">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
