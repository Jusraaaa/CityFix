import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { api } from '../services/api.js';

const initialForm = {
  title: '',
  description: '',
  imageUrl: '',
  latitude: '',
  longitude: '',
  municipalityId: '',
  categoryId: '',
  priorityLevel: '0',
  department: '0'
};

const priorityLevels = [
  { value: '0', label: 'Low' },
  { value: '1', label: 'Medium' },
  { value: '2', label: 'High' },
  { value: '3', label: 'Critical' }
];

const departments = [
  { value: '0', label: 'Sanitation' },
  { value: '1', label: 'Roads' },
  { value: '2', label: 'Electricity' },
  { value: '3', label: 'WaterSupply' },
  { value: '4', label: 'Environment' },
  { value: '5', label: 'PublicSafety' }
];

function CreateIncidentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [imageError, setImageError] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');

  const selectedPosition = useMemo(() => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (
      Number.isFinite(latitude)
      && Number.isFinite(longitude)
      && latitude >= -90
      && latitude <= 90
      && longitude >= -180
      && longitude <= 180
    ) {
      return [latitude, longitude];
    }

    return null;
  }, [form.latitude, form.longitude]);

  useEffect(() => {
    async function loadLookups() {
      try {
        setLoading(true);
        const [categoryData, municipalityData] = await Promise.all([
          api.getCategories(),
          api.getMunicipalities()
        ]);

        setCategories(categoryData);
        setMunicipalities(municipalityData);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadLookups();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    setImageError('');

    if (!file) {
      setSelectedImageName('');
      setForm((current) => ({ ...current, imageUrl: '' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageName(file.name);
      setForm((current) => ({ ...current, imageUrl: String(reader.result) }));
    };
    reader.onerror = () => {
      setImageError('Could not read the selected image. Please try another file.');
    };
    reader.readAsDataURL(file);
  }

  function clearSelectedImage() {
    setSelectedImageName('');
    setImageError('');
    setForm((current) => ({ ...current, imageUrl: '' }));
  }

  function useCurrentLocation() {
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setDetectingLocation(false);
      },
      (geoError) => {
        setLocationError(getLocationErrorMessage(geoError));
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.createIncident({
        ...form,
        imageUrl: form.imageUrl || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        priorityLevel: Number(form.priorityLevel),
        department: Number(form.department)
      });
      navigate('/incidents');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading report form..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Citizen reporting"
        title="Create Incident"
        description="Submit a municipal issue with location, category, and responsible municipality."
      />

      {error && <ErrorState message={error} />}

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label>
          Title
          <input name="title" value={form.title} onChange={updateField} required maxLength="150" />
        </label>

        <div className="image-upload-field">
          <span className="field-label">Incident image</span>
          <div className="image-upload-actions">
            <label className="upload-button">
              Upload from Gallery
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
            <label className="upload-button upload-button-dark">
              Take Photo
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} />
            </label>
          </div>
          {form.imageUrl && (
            <div className="image-thumbnail-row">
              <img src={form.imageUrl} alt="Selected incident preview" />
              <div>
                {selectedImageName && <span className="file-name">{selectedImageName}</span>}
                <button className="text-button" type="button" onClick={clearSelectedImage}>Remove</button>
              </div>
            </div>
          )}
          {imageError && <span className="inline-error">{imageError}</span>}
        </div>

        <label className="span-2">
          Description
          <textarea name="description" value={form.description} onChange={updateField} required rows="5" />
        </label>

        <label>
          Latitude
          <input name="latitude" type="number" step="any" value={form.latitude} onChange={updateField} required />
        </label>

        <label>
          Longitude
          <input name="longitude" type="number" step="any" value={form.longitude} onChange={updateField} required />
        </label>

        <div className="location-actions span-2">
          <button className="button-secondary" type="button" onClick={useCurrentLocation} disabled={detectingLocation}>
            {detectingLocation ? 'Detecting location...' : 'Use My Location'}
          </button>
          {locationError && <span className="inline-error">{locationError}</span>}
        </div>

        <div className="span-2 location-preview">
          <div className="panel-header">
            <h2>Location preview</h2>
            <span>{selectedPosition ? 'Selected' : 'Waiting for coordinates'}</span>
          </div>
          <LocationPreview position={selectedPosition} />
        </div>

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
          Category
          <select name="categoryId" value={form.categoryId} onChange={updateField} required>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>

        <label>
          PriorityLevel
          <select name="priorityLevel" value={form.priorityLevel} onChange={updateField} required>
            {priorityLevels.map((priorityLevel) => (
              <option key={priorityLevel.value} value={priorityLevel.value}>{priorityLevel.label}</option>
            ))}
          </select>
        </label>

        <label>
          Department
          <select name="department" value={form.department} onChange={updateField} required>
            {departments.map((department) => (
              <option key={department.value} value={department.value}>{department.label}</option>
            ))}
          </select>
        </label>

        <div className="form-actions span-2">
          <button className="button-primary" type="submit" disabled={saving}>
            {saving ? 'Submitting...' : 'Submit Incident'}
          </button>
        </div>
      </form>
    </>
  );
}

function LocationPreview({ position }) {
  const center = position ?? [41.6086, 21.7453];
  const zoom = position ? 15 : 8;

  return (
    <div className="map-shell preview-map-shell">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="location-preview-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter position={position} />
        {position && (
          <CircleMarker
            center={position}
            radius={9}
            pathOptions={{
              color: '#d72638',
              fillColor: '#d72638',
              fillOpacity: 0.82,
              weight: 2
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [map, position]);

  return null;
}

function getLocationErrorMessage(error) {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location permission was denied. You can still enter coordinates manually.';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Your current location is unavailable. Please enter coordinates manually.';
  }

  if (error.code === error.TIMEOUT) {
    return 'Location detection timed out. Please try again or enter coordinates manually.';
  }

  return 'Unable to detect your location. Please enter coordinates manually.';
}

export default CreateIncidentPage;
