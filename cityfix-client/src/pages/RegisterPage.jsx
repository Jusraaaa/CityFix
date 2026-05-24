import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../services/api.js';

function RegisterPage({ onAuthSuccess }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
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
      const authResponse = await api.register(form);
      onAuthSuccess(authResponse);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <PageHeader
        eyebrow="Citizen account"
        title="Register"
        description="Create a citizen account for reporting and tracking municipal incidents."
      />

      {error && <ErrorState message={error} />}

      <form className="panel auth-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input name="fullName" value={form.fullName} onChange={updateField} required maxLength="150" />
        </label>

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>

        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} required minLength="6" />
        </label>

        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
