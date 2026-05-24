import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { api } from '../services/api.js';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadCategories() {
    setCategories(await api.getCategories());
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await loadCategories();
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
      await api.createCategory(form);
      setForm({ name: '', description: '' });
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading categories..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Service taxonomy"
        title="Categories"
        description="Manage municipal incident types used when citizens submit reports."
      />

      {error && <ErrorState message={error} />}

      <section className="management-grid">
        <form className="panel compact-form" onSubmit={handleSubmit}>
          <h2>Add category</h2>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
              rows="4"
            />
          </label>
          <button className="button-primary" type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add Category'}
          </button>
        </form>

        <div className="panel">
          <div className="panel-header">
            <h2>Existing categories</h2>
            <span>{categories.length} total</span>
          </div>
          <div className="card-list">
            {categories.length === 0 ? (
              <p className="empty-text">No categories found.</p>
            ) : (
              categories.map((category) => (
                <article className="data-card" key={category.id}>
                  <strong>{category.name}</strong>
                  <p>{category.description}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default CategoriesPage;
