import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { api } from '../services/api.js';

function IncidentDetailsPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadIncident() {
      if (!id) {
        setError('Incident id is missing from the route.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [data, historyData] = await Promise.all([
          api.getIncident(id),
          api.getIncidentStatusHistory(id)
        ]);

        if (!data || !data.id) {
          setIncident(null);
          setStatusHistory([]);
          setError('');
          return;
        }

        setIncident(data);
        setStatusHistory(historyData);
        setError('');
      } catch (err) {
        setIncident(null);
        setStatusHistory([]);
        setError(err.message || 'Unable to load incident details.');
      } finally {
        setLoading(false);
      }
    }

    loadIncident();
  }, [id]);

  const position = useMemo(() => {
    if (!incident) {
      return null;
    }

    const latitude = Number(incident.latitude);
    const longitude = Number(incident.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return [latitude, longitude];
    }

    return null;
  }, [incident]);

  if (loading) {
    return <LoadingState message="Loading incident details..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!incident) {
    return <ErrorState message="Incident was not found." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Incident details"
        title={incident.title || 'Incident details'}
        description="Review the full report details and reported location."
        action={<Link className="button-secondary" to="/incidents">Back to Incidents</Link>}
      />

      <section className="details-grid">
        <article className="panel incident-detail-panel">
          <section className="detail-summary-card">
            <div>
              <span className="detail-kicker">Current state</span>
              <h2>{incident.title || 'Incident details'}</h2>
            </div>
            <div className="detail-badge-group">
              <span className={`status-pill status-${incident.status}`}>{formatStatus(incident.status)}</span>
              <span className={`metadata-pill priority-${incident.priorityLevel}`}>
                {formatPriorityLevel(incident.priorityLevel)}
              </span>
              <span className={`metadata-pill department-${incident.department}`}>
                {formatDepartment(incident.department)}
              </span>
            </div>
          </section>

          <section className="detail-section detail-card">
            <h2>Description</h2>
            <p>{incident.description || 'No description provided.'}</p>
          </section>

          <section className="detail-list">
            <DetailItem label="Category" value={incident.categoryName || 'Uncategorized'} />
            <DetailItem label="Municipality" value={incident.municipalityName || 'Unassigned'} />
            <DetailItem label="Created date" value={formatDate(incident.createdAt)} />
            <DetailItem label="Resolved at" value={incident.resolvedAt ? formatDate(incident.resolvedAt) : 'Not resolved'} />
          </section>

          {incident.imageUrl && (
            <section className="detail-section detail-card">
              <h2>Original incident image</h2>
              <div className="incident-detail-image-frame">
                <img className="incident-detail-image" src={incident.imageUrl} alt={incident.title} />
              </div>
            </section>
          )}

          {incident.adminNote && (
            <section className="detail-section detail-card admin-note-detail">
              <h2>Admin note</h2>
              <p>{incident.adminNote}</p>
            </section>
          )}

          {(incident.resolutionNote || incident.resolutionImageUrl || incident.resolvedAt) && (
            <section className="detail-section detail-card resolution-detail">
              <h2>Resolution</h2>
              {incident.resolvedAt && <p className="resolution-date">Resolved {formatDate(incident.resolvedAt)}</p>}
              {incident.resolutionNote && <p>{incident.resolutionNote}</p>}
              {incident.resolutionImageUrl && (
                <div className="incident-detail-image-frame resolution-image-frame">
                  <img className="incident-detail-image" src={incident.resolutionImageUrl} alt="Resolution" />
                </div>
              )}
            </section>
          )}

          <StatusTimeline statusHistory={statusHistory} />
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Reported location</h2>
            <span>{position ? 'Mapped' : 'No coordinates'}</span>
          </div>

          {position ? (
            <div className="map-shell">
              <MapContainer center={position} zoom={15} scrollWheelZoom={false} className="detail-map">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter position={position} />
                <CircleMarker
                  center={position}
                  radius={10}
                  pathOptions={{
                    color: '#d72638',
                    fillColor: '#d72638',
                    fillOpacity: 0.82,
                    weight: 2
                  }}
                />
              </MapContainer>
            </div>
          ) : (
            <p className="empty-text">This incident does not have valid coordinates.</p>
          )}

          <div className="detail-list location-detail-list">
            <DetailItem label="Latitude" value={incident.latitude} />
            <DetailItem label="Longitude" value={incident.longitude} />
          </div>
        </article>
      </section>
    </>
  );
}

function StatusTimeline({ statusHistory }) {
  return (
    <section className="detail-section detail-card status-history-detail">
      <h2>Status timeline</h2>
      {statusHistory.length === 0 ? (
        <p>No status changes recorded yet.</p>
      ) : (
        <div className="status-timeline">
          {statusHistory.map((entry) => (
            <article className="status-timeline-item" key={entry.id}>
              <div className="timeline-marker" />
              <div>
                <strong>{formatStatus(entry.oldStatus)} to {formatStatus(entry.newStatus)}</strong>
                <time>{formatDate(entry.changedAt)}</time>
                {entry.adminNote && <p>{entry.adminNote}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 15);
  }, [map, position]);

  return null;
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export default IncidentDetailsPage;
