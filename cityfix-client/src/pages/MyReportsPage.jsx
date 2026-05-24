import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { api } from '../services/api.js';

function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priorityLevel: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const data = await api.getMyReports();
        setReports(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load your reports.');
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const filteredReports = applyReportFilters(reports, filters);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters({
      search: '',
      status: 'all',
      priorityLevel: 'all'
    });
  }

  if (loading) {
    return <LoadingState message="Loading your reports..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Citizen reports"
        title="My Reports"
        description="Track the incidents you submitted and review their current resolution progress."
        action={<Link className="button-primary" to="/incidents/new">Report Incident</Link>}
      />

      <section className="panel">
        <div className="my-reports-filters">
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
            Priority
            <select name="priorityLevel" value={filters.priorityLevel} onChange={updateFilter}>
              <option value="all">All</option>
              <option value="0">Low</option>
              <option value="1">Medium</option>
              <option value="2">High</option>
              <option value="3">Critical</option>
            </select>
          </label>

          <button className="button-secondary filter-clear" type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {reports.length === 0 ? (
          <p className="empty-text">You have not submitted any reports yet.</p>
        ) : filteredReports.length === 0 ? (
          <p className="empty-text">No reports match the selected filters.</p>
        ) : (
          <div className="report-card-list">
            {filteredReports.map((report) => (
              <Link className="report-card" key={report.id} to={`/incidents/${report.id}`}>
                <div className="report-card-main">
                  <div>
                    <strong>{report.title || 'Untitled report'}</strong>
                    <span>{report.categoryName || 'Uncategorized'}</span>
                  </div>
                  <div className="detail-badge-group">
                    <span className={`status-pill status-${report.status}`}>{formatStatus(report.status)}</span>
                    <span className={`metadata-pill priority-${report.priorityLevel}`}>
                      {formatPriorityLevel(report.priorityLevel)}
                    </span>
                    <span className={`metadata-pill department-${report.department}`}>
                      {formatDepartment(report.department)}
                    </span>
                  </div>
                </div>

                <div className="report-card-meta">
                  <span>{report.municipalityName || 'Unassigned municipality'}</span>
                  <span>{formatDate(report.createdAt)}</span>
                  <span>{report.resolvedAt ? `Resolved ${formatDate(report.resolvedAt)}` : 'Resolution pending'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function applyReportFilters(reports, filters) {
  const search = filters.search.trim().toLowerCase();

  return reports.filter((report) => {
    const matchesSearch = !search
      || report.title?.toLowerCase().includes(search)
      || report.description?.toLowerCase().includes(search);
    const matchesStatus = filters.status === 'all'
      || (filters.status === 'open' && !isStatus(report.status, 2, 'Resolved'))
      || isStatus(report.status, Number(filters.status), statusNameFromValue(filters.status));
    const matchesPriority = filters.priorityLevel === 'all'
      || isPriorityLevel(report.priorityLevel, Number(filters.priorityLevel), priorityNameFromValue(filters.priorityLevel));

    return matchesSearch && matchesStatus && matchesPriority;
  });
}

function statusNameFromValue(value) {
  return {
    0: 'Pending',
    1: 'InProgress',
    2: 'Resolved'
  }[value];
}

function priorityNameFromValue(value) {
  return {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical'
  }[value];
}

function isStatus(status, numericValue, stringValue) {
  return status === numericValue || status === stringValue;
}

function isPriorityLevel(priorityLevel, numericValue, stringValue) {
  return priorityLevel === numericValue || priorityLevel === stringValue;
}

function formatStatus(status) {
  if (typeof status === 'number') {
    return ['Pending', 'In Progress', 'Resolved'][status] ?? 'Unknown';
  }

  return String(status ?? 'Unknown').replace('InProgress', 'In Progress');
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export default MyReportsPage;
