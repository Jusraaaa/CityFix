import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { api } from '../services/api.js';

const emptyForm = {
  id: '',
  fullName: '',
  email: '',
  password: '',
  municipalityId: '',
  isActive: true
};

function ManageAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [adminData, municipalityData] = await Promise.all([
          api.getAdmins(),
          api.getMunicipalities()
        ]);
        setAdmins(adminData);
        setMunicipalities(municipalityData);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load admins.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function editAdmin(admin) {
    setForm({
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      password: '',
      municipalityId: admin.municipalityId || '',
      isActive: admin.isActive
    });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  async function saveAdmin(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        municipalityId: form.municipalityId,
        isActive: form.isActive
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (form.id) {
        const updated = await api.updateAdmin(form.id, payload);
        setAdmins((current) => current.map((admin) => admin.id === updated.id ? updated : admin));
      } else {
        const created = await api.createAdmin({ ...payload, password: form.password });
        setAdmins((current) => [...current, created].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      }

      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save admin.');
    } finally {
      setSaving(false);
    }
  }

  async function deactivateAdmin(adminId) {
    setError('');

    try {
      await api.deactivateAdmin(adminId);
      setAdmins((current) => current.map((admin) => admin.id === adminId ? { ...admin, isActive: false } : admin));
    } catch (err) {
      setError(err.message || 'Unable to deactivate admin.');
    }
  }

  if (loading) {
    return <LoadingState message="Loading municipality admins..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="SuperAdmin controls"
        title="Manage Admins"
        description="Create and maintain municipality admin accounts and their assigned municipalities."
      />

      {error && <ErrorState message={error} />}

      <section className="management-grid admin-management-grid">
        <form className="panel compact-form" onSubmit={saveAdmin}>
          <div className="panel-header">
            <h2>{form.id ? 'Edit admin' : 'Create admin'}</h2>
            {form.id && <button className="text-button" type="button" onClick={resetForm}>Cancel</button>}
          </div>

          <label>
            Full name
            <input name="fullName" value={form.fullName} onChange={updateField} required maxLength="150" />
          </label>

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} required maxLength="256" />
          </label>

          <label>
            Municipality
            <select name="municipalityId" value={form.municipalityId} onChange={updateField} required>
              <option value="">Select municipality</option>
              {municipalities.map((municipality) => (
                <option key={municipality.id} value={municipality.id}>{municipality.name}</option>
              ))}
            </select>
          </label>

          <label>
            {form.id ? 'New password' : 'Temporary password'}
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              required={!form.id}
              minLength="6"
              placeholder={form.id ? 'Leave blank to keep current password' : ''}
            />
          </label>

          <label className="checkbox-label">
            <input name="isActive" type="checkbox" checked={form.isActive} onChange={updateField} />
            Active
          </label>

          <button className="button-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : form.id ? 'Save Admin' : 'Create Admin'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <h2>Municipality admins</h2>
            <span>{admins.length} accounts</span>
          </div>

          {admins.length === 0 ? (
            <p className="empty-text">No municipality admins have been created yet.</p>
          ) : (
            <div className="admin-list">
              {admins.map((admin) => (
                <article className="admin-card" key={admin.id}>
                  <div>
                    <strong>{admin.fullName}</strong>
                    <span>{admin.email}</span>
                    <small>{admin.municipalityName || 'Unassigned municipality'}</small>
                  </div>
                  <div className="admin-card-actions">
                    <span className={`admin-status ${admin.isActive ? 'admin-status-active' : 'admin-status-inactive'}`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button className="small-action-button" type="button" onClick={() => editAdmin(admin)}>
                      Edit
                    </button>
                    <button
                      className="small-action-button action-danger"
                      type="button"
                      disabled={!admin.isActive}
                      onClick={() => deactivateAdmin(admin.id)}
                    >
                      Deactivate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}

export default ManageAdminsPage;
