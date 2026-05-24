import { useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import IncidentDetailsPage from './pages/IncidentDetailsPage.jsx';
import CreateIncidentPage from './pages/CreateIncidentPage.jsx';
import IncidentMapPage from './pages/IncidentMapPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import MunicipalitiesPage from './pages/MunicipalitiesPage.jsx';
import MyReportsPage from './pages/MyReportsPage.jsx';
import ManageAdminsPage from './pages/ManageAdminsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { clearStoredAuth, getStoredAuth, storeAuth } from './services/authStorage.js';

const allLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/map', label: 'Map' },
  { to: '/incidents/new', label: 'Report Incident' },
  { to: '/my-reports', label: 'My Reports' },
  { to: '/admins', label: 'Manage Admins' },
  { to: '/categories', label: 'Categories' },
  { to: '/municipalities', label: 'Municipalities' }
];

const linksByRole = {
  Citizen: ['/incidents/new', '/my-reports'],
  MunicipalityAdmin: ['/', '/incidents', '/map'],
  SuperAdmin: ['/', '/incidents', '/map', '/admins', '/categories', '/municipalities']
};

function App() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(() => getStoredAuth());
  const visibleLinks = getVisibleLinks(auth?.role);

  function handleAuthSuccess(authResponse) {
    storeAuth(authResponse);
    setAuth(authResponse);

    if (authResponse.role === 'Citizen') {
      navigate('/incidents/new');
      return;
    }

    navigate('/');
  }

  function handleLogout() {
    clearStoredAuth();
    setAuth(null);
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CF</div>
          <div>
            <strong>CityFix</strong>
            <span>Municipal Command Center</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {visibleLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {auth ? (
            <div className="user-card">
              <span>Signed in as</span>
              <strong>{auth.fullName}</strong>
              <small>{auth.role}</small>
              <button className="logout-button" type="button" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="auth-links">
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage auth={auth} />} />
          <Route path="/incidents" element={<IncidentsPage auth={auth} />} />
          <Route path="/incidents/new" element={<CreateIncidentPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailsPage />} />
          <Route path="/map" element={<IncidentMapPage auth={auth} />} />
          <Route path="/my-reports" element={<MyReportsPage />} />
          <Route path="/admins" element={<ManageAdminsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/municipalities" element={<MunicipalitiesPage />} />
          <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<RegisterPage onAuthSuccess={handleAuthSuccess} />} />
        </Routes>
      </main>
    </div>
  );
}

function getVisibleLinks(role) {
  if (!role) {
    return allLinks;
  }

  const allowedRoutes = linksByRole[role] ?? allLinks.map((link) => link.to);
  return allLinks.filter((link) => allowedRoutes.includes(link.to));
}

export default App;
