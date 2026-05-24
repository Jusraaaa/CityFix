import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import StatCard from '../components/StatCard.jsx';
import { api } from '../services/api.js';

function DashboardPage({ auth }) {
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byMunicipality, setByMunicipality] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [summaryData, categoryData, municipalityData, incidentsData] = await Promise.all([
          api.getDashboardSummary(),
          api.getIncidentsByCategory(),
          api.getIncidentsByMunicipality(),
          api.getIncidents()
        ]);

        if (auth?.role === 'MunicipalityAdmin' && auth.municipalityId) {
          const municipalityIncidents = incidentsData.filter(
            (incident) => incident.municipalityId === auth.municipalityId
          );

          setSummary(createMunicipalitySummary(municipalityIncidents));
          setByCategory(groupIncidentsByCategory(municipalityIncidents));
          setByMunicipality(groupIncidentsByMunicipality(municipalityIncidents));
          setRecentActivity(await createRecentActivity(municipalityIncidents));
        } else {
          const allActivity = await createRecentActivity(incidentsData);
          setSummary(createSuperAdminSummary(summaryData));
          setByCategory(categoryData);
          setByMunicipality(municipalityData);
          setRecentActivity(allActivity);
        }
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [auth?.municipalityId, auth?.role]);

  if (loading) {
    return <LoadingState message="Loading dashboard metrics..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Operational overview"
        title={auth?.role === 'MunicipalityAdmin' ? 'Municipality Dashboard' : 'CityFix Dashboard'}
        description={auth?.role === 'MunicipalityAdmin'
          ? 'Monitor reports, response progress, and resolution performance for your assigned municipality.'
          : 'Monitor incident volume, response status, and distribution across services and municipalities.'}
      />

      <section className={`stats-grid ${auth?.role === 'SuperAdmin' ? 'superadmin-stats-grid' : ''}`}>
        {getDashboardCards(summary, auth?.role).map((card) => (
          card.href ? (
            <Link className="stat-card-link" key={card.label} to={card.href}>
              <StatCard label={card.label} value={card.value} tone={card.tone} />
            </Link>
          ) : (
            <StatCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
          )
        ))}
      </section>

      {auth?.role === 'SuperAdmin' ? (
        <SuperAdminDashboard
          summary={summary}
          byCategory={byCategory}
          byMunicipality={byMunicipality}
          recentActivity={recentActivity}
        />
      ) : (
        <>
          <section className="dashboard-grid">
            <GroupedPanel title="Incidents by category" items={byCategory} />
            <GroupedPanel
              title="Assigned Municipality Overview"
              items={byMunicipality}
              singleGroupLabel="Assigned municipality"
            />
          </section>

          <ActivityFeed activities={recentActivity} />
        </>
      )}
    </>
  );
}

function createMunicipalitySummary(incidents) {
  const pendingIncidents = incidents.filter((incident) => isStatus(incident.status, 0, 'Pending')).length;
  const inProgressIncidents = incidents.filter((incident) => isStatus(incident.status, 1, 'InProgress')).length;
  const resolvedIncidents = incidents.filter((incident) => isStatus(incident.status, 2, 'Resolved')).length;
  const openIncidents = pendingIncidents + inProgressIncidents;
  const resolvedRate = incidents.length === 0 ? 0 : Math.round((resolvedIncidents / incidents.length) * 100);

  return {
    totalIncidents: incidents.length,
    pendingIncidents,
    inProgressIncidents,
    resolvedIncidents,
    openIncidents,
    resolvedRate: `${resolvedRate}%`
  };
}

function createSuperAdminSummary(summary) {
  return {
    ...summary,
    openIncidents: summary.pendingIncidents + summary.inProgressIncidents
  };
}

function getDashboardCards(summary, role) {
  const baseCards = [
    { label: 'Total incidents', value: summary.totalIncidents, tone: 'dark', href: '/incidents' },
    { label: 'Pending', value: summary.pendingIncidents, tone: 'red', href: '/incidents?status=Pending' },
    { label: 'In progress', value: summary.inProgressIncidents, tone: 'gold', href: '/incidents?status=InProgress' },
    { label: 'Resolved', value: summary.resolvedIncidents, tone: 'green', href: '/incidents?status=Resolved' }
  ];

  if (role === 'MunicipalityAdmin') {
    return [
      ...baseCards,
      { label: 'Open incidents', value: summary.openIncidents, tone: 'blue', href: '/incidents?status=open' },
      { label: 'Resolved rate', value: summary.resolvedRate, tone: 'green' }
    ];
  }

  return [
    ...baseCards,
    { label: 'Open incidents', value: summary.openIncidents, tone: 'blue', href: '/incidents?status=open' },
    { label: 'Municipalities', value: summary.totalMunicipalities, href: '/municipalities' },
    { label: 'Categories', value: summary.totalCategories, href: '/categories' }
  ];
}

function groupIncidentsByCategory(incidents) {
  return groupIncidents(incidents, 'categoryId', 'categoryName', 'Uncategorized');
}

function groupIncidentsByMunicipality(incidents) {
  return groupIncidents(incidents, 'municipalityId', 'municipalityName', 'Assigned municipality');
}

function groupIncidents(incidents, idKey, nameKey, fallbackName) {
  const groups = new Map();

  incidents.forEach((incident) => {
    const id = incident[idKey] || fallbackName;
    const existing = groups.get(id);

    if (existing) {
      existing.incidentCount += 1;
      return;
    }

    groups.set(id, {
      id,
      name: incident[nameKey] || fallbackName,
      incidentCount: 1
    });
  });

  return Array.from(groups.values()).sort((a, b) => b.incidentCount - a.incidentCount || a.name.localeCompare(b.name));
}

function isStatus(status, numericValue, stringValue) {
  return status === numericValue || status === stringValue;
}

async function createRecentActivity(incidents) {
  const historyResults = await Promise.all(
    incidents.map(async (incident) => {
      try {
        const history = await api.getIncidentStatusHistory(incident.id);
        return history.map((entry) => createStatusActivity(entry, incident));
      } catch {
        return [];
      }
    })
  );

  const createdActivities = incidents.map((incident) => ({
    id: `created-${incident.id}`,
    incidentId: incident.id,
    type: 'Incident created',
    title: incident.title || 'Untitled incident',
    category: incident.categoryName || 'Uncategorized',
    statusChange: 'New report',
    timestamp: incident.createdAt
  }));

  const historyActivities = historyResults.flat();
  const resolvedIncidentIds = new Set(
    historyActivities
      .filter((activity) => activity.eventType === 'resolved')
      .map((activity) => activity.incidentId)
  );

  const resolutionActivities = incidents
    .filter((incident) => incident.resolutionNote && incident.resolvedAt && !resolvedIncidentIds.has(incident.id))
    .map((incident) => ({
      id: `resolution-note-${incident.id}`,
      incidentId: incident.id,
      eventType: 'resolution-note',
      type: 'Resolution note added',
      title: incident.title || 'Untitled incident',
      category: incident.categoryName || 'Uncategorized',
      statusChange: 'Resolved',
      timestamp: incident.resolvedAt
    }));

  return dedupeActivities([...createdActivities, ...historyActivities, ...resolutionActivities])
    .filter((activity) => activity.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);
}

function createStatusActivity(entry, incident) {
  const newStatus = formatStatus(entry.newStatus);
  const resolved = isStatus(entry.newStatus, 2, 'Resolved');

  return {
    id: `status-${entry.id}`,
    incidentId: incident.id,
    eventType: resolved ? 'resolved' : 'status-changed',
    type: resolved ? 'Incident resolved' : 'Status changed',
    title: incident.title || 'Untitled incident',
    category: incident.categoryName || 'Uncategorized',
    statusChange: `${formatStatus(entry.oldStatus)} to ${newStatus}`,
    timestamp: entry.changedAt
  };
}

function dedupeActivities(activities) {
  const seen = new Set();

  return activities.filter((activity) => {
    const key = `${activity.incidentId}-${activity.type}-${activity.statusChange}-${activity.timestamp}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function formatStatus(status) {
  if (typeof status === 'number') {
    return ['Pending', 'In Progress', 'Resolved'][status] ?? 'Unknown';
  }

  return String(status ?? 'Unknown').replace('InProgress', 'In Progress');
}

function formatActivityDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function GroupedPanel({ title, items, singleGroupLabel, className = '', collapsible = false, rowLinkBuilder }) {
  const [showAll, setShowAll] = useState(false);
  const max = Math.max(...items.map((item) => item.incidentCount), 1);
  const groupLabel = singleGroupLabel && items.length === 1 ? singleGroupLabel : `${items.length} groups`;
  const visibleItems = collapsible && !showAll ? items.slice(0, 3) : items;
  const hasMoreItems = collapsible && items.length > 3;
  const renderRow = (item) => {
    const rowContent = (
      <>
        <div className="bar-meta">
          <span>{item.name}</span>
          <strong>{item.incidentCount}</strong>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${(item.incidentCount / max) * 100}%` }} />
        </div>
      </>
    );

    if (!rowLinkBuilder) {
      return (
        <div className="bar-row" key={item.id}>
          {rowContent}
        </div>
      );
    }

    return (
      <Link className="bar-row bar-row-link" key={item.id} to={rowLinkBuilder(item)}>
        {rowContent}
      </Link>
    );
  };

  return (
    <article className={`panel ${className}`.trim()}>
      <div className="panel-header">
        <h2>{title}</h2>
        <span>{groupLabel}</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-text">No data available yet.</p>
      ) : (
        <div className="bar-list">
          {visibleItems.map(renderRow)}
        </div>
      )}

      {hasMoreItems && (
        <button className="chart-toggle-button" type="button" onClick={() => setShowAll((current) => !current)}>
          {showAll ? 'Show less' : 'Show all'}
        </button>
      )}
    </article>
  );
}

function ActivityFeed({ activities, title = 'Recent Activity' }) {
  return (
    <section className="panel activity-feed">
      <div className="panel-header">
        <h2>{title}</h2>
        <span>{activities.length} latest</span>
      </div>

      {activities.length === 0 ? (
        <p className="empty-text">No recent activity yet.</p>
      ) : (
        <div className="activity-list">
          {activities.map((activity) => (
            <Link className="activity-item" key={activity.id} to={`/incidents/${activity.incidentId}`}>
              <div>
                <span>{activity.type}</span>
                <strong>{activity.title}</strong>
                <small>{activity.category}</small>
              </div>
              <div className="activity-meta">
                <span>{activity.statusChange}</span>
                <time>{formatActivityDate(activity.timestamp)}</time>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function SuperAdminDashboard({ summary, byCategory, byMunicipality, recentActivity }) {
  const statusItems = [
    { id: 'pending', name: 'Pending', incidentCount: summary.pendingIncidents, tone: 'red' },
    { id: 'in-progress', name: 'In Progress', incidentCount: summary.inProgressIncidents, tone: 'gold' },
    { id: 'resolved', name: 'Resolved', incidentCount: summary.resolvedIncidents, tone: 'green' }
  ];

  return (
    <>
      <section className="superadmin-dashboard-grid">
        <GroupedPanel
          title="Incidents by Municipality"
          items={byMunicipality}
          className="superadmin-wide-panel"
          rowLinkBuilder={(item) => `/incidents?municipalityId=${encodeURIComponent(item.id)}`}
          collapsible
        />
        <GroupedPanel
          title="Incidents by Category"
          items={byCategory}
          className="superadmin-wide-panel"
          rowLinkBuilder={(item) => `/incidents?categoryId=${encodeURIComponent(item.id)}`}
          collapsible
        />
        <StatusDistributionPanel items={statusItems} total={summary.totalIncidents} />
        <SystemOverviewPanel summary={summary} />
        <QuickManagementPanel />
      </section>

      <ActivityFeed title="Recent System Activity" activities={recentActivity} />
    </>
  );
}

function StatusDistributionPanel({ items, total }) {
  const gradient = createStatusGradient(items, total);
  const statusLinks = {
    pending: '/incidents?status=Pending',
    'in-progress': '/incidents?status=InProgress',
    resolved: '/incidents?status=Resolved'
  };

  return (
    <article className="panel status-distribution-panel">
      <div className="panel-header">
        <h2>Incidents by Status</h2>
        <span>{total} total</span>
      </div>

      {total === 0 ? (
        <p className="empty-text">No status data available yet.</p>
      ) : (
        <div className="status-distribution-content">
          <div className="status-donut" style={{ background: gradient }}>
            <div>{total}</div>
          </div>
          <div className="status-distribution-list">
            {items.map((item) => (
              <Link className="status-distribution-row status-distribution-link" key={item.id} to={statusLinks[item.id]}>
                <span className={`status-dot status-dot-${item.tone}`} />
                <strong>{item.name}</strong>
                <em>{item.incidentCount}</em>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function SystemOverviewPanel({ summary }) {
  const overviewItems = [
    { label: 'Municipalities', value: summary.totalMunicipalities, href: '/municipalities' },
    { label: 'Categories', value: summary.totalCategories, href: '/categories' },
    { label: 'Active incidents', value: summary.openIncidents, href: '/incidents?status=open' }
  ];

  return (
    <article className="panel system-overview-panel">
      <div className="panel-header">
        <h2>System Overview</h2>
        <span>Live totals</span>
      </div>

      <div className="system-overview-list">
        {overviewItems.map((item) => (
          <Link className="system-overview-item system-overview-link" key={item.label} to={item.href}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </Link>
        ))}
      </div>
    </article>
  );
}

function QuickManagementPanel() {
  const links = [
    { to: '/admins', label: 'Manage Admins', description: 'Create and update municipality admin access.' },
    { to: '/municipalities', label: 'Municipalities', description: 'Maintain municipal coverage areas.' },
    { to: '/categories', label: 'Categories', description: 'Manage incident classification options.' }
  ];

  return (
    <article className="panel quick-management-panel">
      <div className="panel-header">
        <h2>Quick Management</h2>
        <span>{links.length} tools</span>
      </div>

      <div className="quick-management-list">
        {links.map((link) => (
          <Link className="quick-management-link" key={link.to} to={link.to}>
            <strong>{link.label}</strong>
            <span>{link.description}</span>
          </Link>
        ))}
      </div>
    </article>
  );
}

function createStatusGradient(items, total) {
  const colors = {
    red: '#d72638',
    gold: '#f7c948',
    green: '#147a4b'
  };

  let cursor = 0;
  const segments = items
    .filter((item) => item.incidentCount > 0)
    .map((item) => {
      const start = cursor;
      const end = cursor + (item.incidentCount / total) * 100;
      cursor = end;
      return `${colors[item.tone]} ${start}% ${end}%`;
    });

  return `conic-gradient(${segments.join(', ')})`;
}

export default DashboardPage;
