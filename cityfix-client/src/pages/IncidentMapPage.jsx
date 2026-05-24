import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { api } from '../services/api.js';

const NORTH_MACEDONIA_CENTER = [41.6086, 21.7453];

function IncidentMapPage({ auth }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadIncidents() {
      try {
        setLoading(true);
        const incidentsData = await api.getIncidents();
        setIncidents(filterIncidentsForRole(incidentsData, auth));
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, [auth?.municipalityId, auth?.role]);

  const mappedIncidents = useMemo(
    () => incidents.filter((incident) => hasValidCoordinates(incident)),
    [incidents]
  );

  if (loading) {
    return <LoadingState message="Loading incident map..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Geospatial monitoring"
        title="Incident Map"
        description={auth?.role === 'MunicipalityAdmin'
          ? 'View reported incidents by location for your assigned municipality.'
          : 'View reported municipal incidents by location across North Macedonia.'}
      />

      <section className="panel map-panel">
        <div className="panel-header">
          <h2>Live incident locations</h2>
          <span>{mappedIncidents.length} mapped</span>
        </div>

        <div className="map-shell">
          <MapContainer center={NORTH_MACEDONIA_CENTER} zoom={8} scrollWheelZoom className="incident-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappedIncidents.map((incident) => {
              const statusColor = getStatusColor(incident.status);
              const critical = isCriticalPriority(incident.priorityLevel);

              return (
              <Marker
                key={incident.id}
                position={[Number(incident.latitude), Number(incident.longitude)]}
                icon={createIncidentMarkerIcon(statusColor, critical)}
              >
                <Popup>
                  <div className="map-popup">
                    <div className="map-popup-header">
                      <strong>{incident.title || 'Untitled incident'}</strong>
                      <small>{incident.categoryName || 'Uncategorized incident'}</small>
                    </div>
                    <p>{incident.municipalityName || 'Unassigned municipality'}</p>
                    <div className="map-popup-badges">
                      <span className={`status-pill status-${incident.status}`}>{formatStatus(incident.status)}</span>
                      <span className={`metadata-pill priority-${incident.priorityLevel}`}>
                        {formatPriorityLevel(incident.priorityLevel)}
                      </span>
                    </div>
                    <Link className="map-popup-link" to={`/incidents/${incident.id}`}>Open details</Link>
                  </div>
                </Popup>
              </Marker>
              );
            })}
          </MapContainer>
        </div>

        {mappedIncidents.length === 0 && (
          <p className="map-note">No incidents with valid coordinates are available yet.</p>
        )}
      </section>
    </>
  );
}

function filterIncidentsForRole(incidents, auth) {
  if (auth?.role === 'MunicipalityAdmin' && auth.municipalityId) {
    return incidents.filter((incident) => incident.municipalityId === auth.municipalityId);
  }

  return incidents;
}

function hasValidCoordinates(incident) {
  const latitude = Number(incident.latitude);
  const longitude = Number(incident.longitude);

  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
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

function getStatusColor(status) {
  const normalized = typeof status === 'number' ? status : String(status);

  if (normalized === 2 || normalized === 'Resolved') {
    return '#147a4b';
  }

  if (normalized === 1 || normalized === 'InProgress') {
    return '#b98900';
  }

  return '#d72638';
}

function isCriticalPriority(priorityLevel) {
  return priorityLevel === 3 || priorityLevel === 'Critical';
}

function createIncidentMarkerIcon(color, critical) {
  return L.divIcon({
    className: '',
    html: `<span class="incident-marker ${critical ? 'incident-marker-critical' : ''}" style="--marker-color: ${color}"></span>`,
    iconSize: [critical ? 24 : 20, critical ? 24 : 20],
    iconAnchor: [critical ? 12 : 10, critical ? 12 : 10],
    popupAnchor: [0, critical ? -14 : -12]
  });
}

export default IncidentMapPage;
