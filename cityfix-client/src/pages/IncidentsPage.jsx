import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { api } from '../services/api.js';

function IncidentsPage({ auth }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: getStatusFilterFromQuery(searchParams.get('status')),
    priorityLevel: 'all',
    department: 'all',
    categoryId: getEntityFilterFromQuery(searchParams, 'categoryId', 'category', []),
    categoryName: getNameFilterFromQuery(searchParams, 'category'),
    municipalityId: getEntityFilterFromQuery(searchParams, 'municipalityId', 'municipality', [])
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [adminNotes, setAdminNotes] = useState({});
  const [resolutionEditorId, setResolutionEditorId] = useState('');
  const [resolutionDrafts, setResolutionDrafts] = useState({});
  const [error, setError] = useState('');
  const isMunicipalityAdmin = auth?.role === 'MunicipalityAdmin';
  const canCreateIncident = auth?.role === 'Citizen';
  const canManageIncidentWorkflow = isMunicipalityAdmin;

  function openIncident(incidentId) {
    if (incidentId) {
      navigate(`/incidents/${incidentId}`);
    }
  }

  useEffect(() => {
    async function loadIncidents() {
      try {
        setLoading(true);
        const [incidentsData, categoriesData, municipalitiesData] = await Promise.all([
          api.getIncidents(),
          api.getCategories(),
          api.getMunicipalities()
        ]);

        setIncidents(filterIncidentsForRole(incidentsData, auth));
        setAdminNotes(createAdminNoteState(incidentsData));
        setCategories(categoriesData);
        setMunicipalities(filterMunicipalitiesForRole(municipalitiesData, auth));
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, [auth?.municipalityId, auth?.role]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      status: getStatusFilterFromQuery(searchParams.get('status')),
      categoryId: getEntityFilterFromQuery(searchParams, 'categoryId', 'category', categories),
      categoryName: getNameFilterFromQuery(searchParams, 'category'),
      municipalityId: isMunicipalityAdmin
        ? 'all'
        : getEntityFilterFromQuery(searchParams, 'municipalityId', 'municipality', municipalities)
    }));
  }, [categories, isMunicipalityAdmin, municipalities, searchParams]);

  const filteredIncidents = applyIncidentFilters(incidents, filters);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'categoryId' ? { categoryName: '' } : {})
    }));
  }

  function clearFilters() {
    setFilters({
      search: '',
      status: 'all',
      priorityLevel: 'all',
      department: 'all',
      categoryId: 'all',
      categoryName: '',
      municipalityId: 'all'
    });
  }

  async function updateStatus(event, incidentId, status, resolution = {}) {
    event.stopPropagation();
    setUpdatingId(incidentId);
    setError('');

    try {
      const adminNote = adminNotes[incidentId] || '';
      await api.updateIncidentStatus(incidentId, status, adminNote, resolution);
      const resolvedAt = isStatus(status, 2, 'Resolved') ? new Date().toISOString() : undefined;
      setIncidents((current) =>
        current.map((incident) => incident.id === incidentId
          ? {
            ...incident,
            status,
            adminNote,
            ...(resolvedAt
              ? {
                resolutionNote: resolution.resolutionNote || null,
                resolutionImageUrl: resolution.resolutionImageUrl || null,
                resolvedAt
              }
              : {})
          }
          : incident)
      );
      setResolutionEditorId('');
    } catch (err) {
      setError(err.message || 'Unable to update incident status.');
    } finally {
      setUpdatingId('');
    }
  }

  function updateAdminNote(event, incidentId) {
    event.stopPropagation();
    const { value } = event.target;
    setAdminNotes((current) => ({ ...current, [incidentId]: value }));
  }

  function openResolutionEditor(event, incidentId) {
    event.stopPropagation();
    setResolutionEditorId((current) => current === incidentId ? '' : incidentId);
    setResolutionDrafts((current) => ({
      ...current,
      [incidentId]: current[incidentId] || { resolutionNote: '', resolutionImageUrl: '', imageName: '', imageError: '' }
    }));
  }

  function updateResolutionNote(event, incidentId) {
    event.stopPropagation();
    const { value } = event.target;
    setResolutionDrafts((current) => ({
      ...current,
      [incidentId]: {
        ...(current[incidentId] || {}),
        resolutionNote: value
      }
    }));
  }

  function handleResolutionImageChange(event, incidentId) {
    event.stopPropagation();
    const file = event.target.files?.[0];

    if (!file) {
      setResolutionDrafts((current) => ({
        ...current,
        [incidentId]: {
          ...(current[incidentId] || {}),
          resolutionImageUrl: '',
          imageName: '',
          imageError: ''
        }
      }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setResolutionDrafts((current) => ({
        ...current,
        [incidentId]: {
          ...(current[incidentId] || {}),
          imageError: 'Please select a valid image file.'
        }
      }));
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setResolutionDrafts((current) => ({
        ...current,
        [incidentId]: {
          ...(current[incidentId] || {}),
          resolutionImageUrl: String(reader.result),
          imageName: file.name,
          imageError: ''
        }
      }));
    };
    reader.onerror = () => {
      setResolutionDrafts((current) => ({
        ...current,
        [incidentId]: {
          ...(current[incidentId] || {}),
          imageError: 'Could not read the selected image. Please try another file.'
        }
      }));
    };
    reader.readAsDataURL(file);
  }

  function clearResolutionImage(event, incidentId) {
    event.stopPropagation();
    setResolutionDrafts((current) => ({
      ...current,
      [incidentId]: {
        ...(current[incidentId] || {}),
        resolutionImageUrl: '',
        imageName: '',
        imageError: ''
      }
    }));
  }

  async function submitResolved(event, incidentId) {
    const draft = resolutionDrafts[incidentId] || {};
    await updateStatus(event, incidentId, 2, {
      resolutionNote: draft.resolutionNote || null,
      resolutionImageUrl: draft.resolutionImageUrl || null
    });
  }

  if (loading) {
    return <LoadingState message="Loading incidents..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Incident monitoring"
        title="Incidents"
        description="Review submitted reports and their current municipal workflow status."
        action={canCreateIncident ? <Link className="button-primary" to="/incidents/new">Create Incident</Link> : null}
      />

      <section className="panel">
        <div className={`filters-grid ${isMunicipalityAdmin ? 'filters-grid-compact' : ''}`}>
          <label className="filter-search">
            Search
            <input
              name="search"
              value={filters.search}
              onChange={updateFilter}
              placeholder="Search title or description"
            />
          </label>

          <label>
            Status
            <select name="status" value={filters.status} onChange={updateFilter}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="0">Pending</option>
              <option value="1">In Progress</option>
              <option value="2">Resolved</option>
            </select>
          </label>

          <label>
            Category
            <select name="categoryId" value={filters.categoryId} onChange={updateFilter}>
              <option value="all">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select name="priorityLevel" value={filters.priorityLevel} onChange={updateFilter}>
              <option value="all">All</option>
              <option value="0">Low</option>
              <option value="1">Medium</option>
              <option value="2">High</option>
              <option value="3">Critical</option>
            </select>
          </label>

          <label>
            Department
            <select name="department" value={filters.department} onChange={updateFilter}>
              <option value="all">All</option>
              <option value="0">Sanitation</option>
              <option value="1">Roads</option>
              <option value="2">Electricity</option>
              <option value="3">WaterSupply</option>
              <option value="4">Environment</option>
              <option value="5">PublicSafety</option>
            </select>
          </label>

          {!isMunicipalityAdmin && (
            <label>
              Municipality
              <select name="municipalityId" value={filters.municipalityId} onChange={updateFilter}>
                <option value="all">All</option>
                {municipalities.map((municipality) => (
                  <option key={municipality.id} value={municipality.id}>{municipality.name}</option>
                ))}
              </select>
            </label>
          )}

          <button className="button-secondary filter-clear" type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {incidents.length === 0 ? (
          <p className="empty-text">No incidents have been submitted yet.</p>
        ) : filteredIncidents.length === 0 ? (
          <p className="empty-text">No incidents match the selected filters.</p>
        ) : (
          <div className="table-wrap">
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Department</th>
                  <th>Municipality</th>
                  <th>Category</th>
                  <th>Created</th>
                  {canManageIncidentWorkflow && <th>Admin note</th>}
                  {canManageIncidentWorkflow && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident) => (
                  <tr
                    className="clickable-row"
                    key={incident.id}
                    tabIndex="0"
                    onClick={() => openIncident(incident.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openIncident(incident.id);
                      }
                    }}
                  >
                    <td>
                      <strong>{incident.title}</strong>
                    </td>
                    <td>
                      <span className={`status-pill status-${incident.status}`}>{formatStatus(incident.status)}</span>
                    </td>
                    <td>
                      <span className={`metadata-pill priority-${incident.priorityLevel}`}>
                        {formatPriorityLevel(incident.priorityLevel)}
                      </span>
                    </td>
                    <td>
                      <span className={`metadata-pill department-${incident.department}`}>
                        {formatDepartment(incident.department)}
                      </span>
                    </td>
                    <td>{incident.municipalityName || 'Unassigned'}</td>
                    <td>{incident.categoryName || 'Uncategorized'}</td>
                    <td>{formatDate(incident.createdAt)}</td>
                    {canManageIncidentWorkflow && (
                      <td>
                        <textarea
                          className="admin-note-input"
                          value={adminNotes[incident.id] || ''}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                          onChange={(event) => updateAdminNote(event, incident.id)}
                          placeholder="Optional note for this incident"
                          rows="2"
                        />
                      </td>
                    )}
                    {canManageIncidentWorkflow && (
                      <td>
                        <div className="table-actions">
                          <button
                            className="small-action-button"
                            type="button"
                            disabled={updatingId === incident.id || isStatus(incident.status, 1, 'InProgress')}
                            onClick={(event) => updateStatus(event, incident.id, 1)}
                          >
                            Mark In Progress
                          </button>
                          <button
                            className="small-action-button action-resolved"
                            type="button"
                            disabled={updatingId === incident.id || isStatus(incident.status, 2, 'Resolved')}
                            onClick={(event) => openResolutionEditor(event, incident.id)}
                          >
                            Mark Resolved
                          </button>
                          {resolutionEditorId === incident.id && (
                            <div className="resolution-editor" onClick={(event) => event.stopPropagation()}>
                              <textarea
                                value={resolutionDrafts[incident.id]?.resolutionNote || ''}
                                onKeyDown={(event) => event.stopPropagation()}
                                onChange={(event) => updateResolutionNote(event, incident.id)}
                                placeholder="Resolution note"
                                rows="2"
                              />
                              <label className="resolution-upload-button">
                                Resolution Photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => handleResolutionImageChange(event, incident.id)}
                                />
                              </label>
                              {resolutionDrafts[incident.id]?.imageName && (
                                <div className="resolution-image-meta">
                                  <span>{resolutionDrafts[incident.id].imageName}</span>
                                  <button type="button" onClick={(event) => clearResolutionImage(event, incident.id)}>
                                    Remove
                                  </button>
                                </div>
                              )}
                              {resolutionDrafts[incident.id]?.imageError && (
                                <span className="inline-error">{resolutionDrafts[incident.id].imageError}</span>
                              )}
                              <button
                                className="small-action-button action-resolved"
                                type="button"
                                disabled={updatingId === incident.id}
                                onClick={(event) => submitResolved(event, incident.id)}
                              >
                                Save Resolved
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function createAdminNoteState(incidents) {
  return incidents.reduce((notes, incident) => {
    notes[incident.id] = incident.adminNote || '';
    return notes;
  }, {});
}

function filterIncidentsForRole(incidents, auth) {
  if (auth?.role === 'MunicipalityAdmin' && auth.municipalityId) {
    return incidents.filter((incident) => incident.municipalityId === auth.municipalityId);
  }

  return incidents;
}

function filterMunicipalitiesForRole(municipalities, auth) {
  if (auth?.role === 'MunicipalityAdmin' && auth.municipalityId) {
    return municipalities.filter((municipality) => municipality.id === auth.municipalityId);
  }

  return municipalities;
}

function applyIncidentFilters(incidents, filters) {
  const search = filters.search.trim().toLowerCase();

  return incidents.filter((incident) => {
    const matchesSearch = !search
      || incident.title?.toLowerCase().includes(search)
      || incident.description?.toLowerCase().includes(search);

    const matchesStatus = filters.status === 'all'
      || (filters.status === 'open' && !isStatus(incident.status, 2, 'Resolved'))
      || isStatus(incident.status, Number(filters.status), statusNameFromValue(filters.status));

    const matchesCategory = (filters.categoryId === 'all' || idsMatch(incident.categoryId, filters.categoryId))
      && (!filters.categoryName || namesMatch(incident.categoryName, filters.categoryName));
    const matchesMunicipality = filters.municipalityId === 'all' || idsMatch(incident.municipalityId, filters.municipalityId);
    const matchesPriority = filters.priorityLevel === 'all'
      || isPriorityLevel(incident.priorityLevel, Number(filters.priorityLevel), priorityNameFromValue(filters.priorityLevel));
    const matchesDepartment = filters.department === 'all'
      || isDepartment(incident.department, Number(filters.department), departmentNameFromValue(filters.department));

    return matchesSearch && matchesStatus && matchesCategory && matchesMunicipality && matchesPriority && matchesDepartment;
  });
}

function getStatusFilterFromQuery(status) {
  if (!status) {
    return 'all';
  }

  const normalized = status.trim().toLowerCase();

  return {
    pending: '0',
    inprogress: '1',
    'in-progress': '1',
    resolved: '2',
    open: 'open',
    all: 'all',
    0: '0',
    1: '1',
    2: '2'
  }[normalized] || 'all';
}

function getEntityFilterFromQuery(searchParams, idKey, nameKey, entities) {
  const idValue = searchParams.get(idKey);

  if (idValue) {
    return idValue;
  }

  const nameValue = searchParams.get(nameKey);

  if (!nameValue) {
    return 'all';
  }

  const normalizedName = nameValue.trim().toLowerCase();
  const match = entities.find((entity) => entity.name?.trim().toLowerCase() === normalizedName);

  return match?.id || 'all';
}

function getNameFilterFromQuery(searchParams, nameKey) {
  return searchParams.get(nameKey)?.trim() || '';
}

function idsMatch(left, right) {
  return String(left ?? '').toLowerCase() === String(right ?? '').toLowerCase();
}

function namesMatch(left, right) {
  return normalizeFilterName(left) === normalizeFilterName(right);
}

function normalizeFilterName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function statusNameFromValue(value) {
  return {
    0: 'Pending',
    1: 'InProgress',
    2: 'Resolved'
  }[value];
}

function isStatus(status, numericValue, stringValue) {
  return status === numericValue || status === stringValue;
}

function priorityNameFromValue(value) {
  return {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical'
  }[value];
}

function departmentNameFromValue(value) {
  return {
    0: 'Sanitation',
    1: 'Roads',
    2: 'Electricity',
    3: 'WaterSupply',
    4: 'Environment',
    5: 'PublicSafety'
  }[value];
}

function isPriorityLevel(priorityLevel, numericValue, stringValue) {
  return priorityLevel === numericValue || priorityLevel === stringValue;
}

function isDepartment(department, numericValue, stringValue) {
  return department === numericValue || department === stringValue;
}

function formatStatus(status) {
  if (typeof status === 'number') {
    return ['Pending', 'In Progress', 'Resolved'][status] ?? 'Unknown';
  }

  return String(status).replace('InProgress', 'In Progress');
}

function formatPriorityLevel(priorityLevel) {
  if (typeof priorityLevel === 'number') {
    return ['Low', 'Medium', 'High', 'Critical'][priorityLevel] ?? 'Unknown';
  }

  return String(priorityLevel ?? 'Unknown');
}

function formatDepartment(department) {
  if (typeof department === 'number') {
    return ['Sanitation', 'Roads', 'Electricity', 'WaterSupply', 'Environment', 'PublicSafety'][department] ?? 'Unknown';
  }

  return String(department ?? 'Unknown');
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default IncidentsPage;
