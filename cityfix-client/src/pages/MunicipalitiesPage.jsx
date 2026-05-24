import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { api } from '../services/api.js';

function MunicipalitiesPage() {
  const [municipalities, setMunicipalities] = useState([]);
  const [form, setForm] = useState({ name: '', region: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadMunicipalities() {
    setMunicipalities(await api.getMunicipalities());
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await loadMunicipalities();
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.createMunicipality(form);
      setForm({ name: '', region: '' });
      await loadMunicipalities();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading municipalities..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Municipal coverage"
        title="Municipalities"
        description="Maintain the municipality list used for incident routing and analytics."
      />

      {error && <ErrorState message={error} />}

      <section className="management-grid">
        <form className="panel compact-form" onSubmit={handleSubmit}>
          <h2>Add municipality</h2>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Region
            <input
              value={form.region}
              onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              required
            />
          </label>
          <button className="button-primary" type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add Municipality'}
          </button>
        </form>

        <div className="panel">
          <div className="panel-header">
            <h2>Existing municipalities</h2>
            <span>{municipalities.length} total</span>
          </div>
          <div className="card-list">
            {municipalities.length === 0 ? (
              <p className="empty-text">No municipalities found.</p>
            ) : (
              municipalities.map((municipality) => (
                <article className="data-card" key={municipality.id}>
                  <strong>{municipality.name}</strong>
                  <p>{municipality.region}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default MunicipalitiesPage;
