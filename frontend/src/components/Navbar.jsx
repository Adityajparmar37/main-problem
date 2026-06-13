import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-logo">
          🧠 <span>MindMate</span>
        </NavLink>

        <div className="navbar-nav">
          <NavLink
            to="/voice/setup"
            id="nav-voice"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            🎙️ <span>Check-in</span>
          </NavLink>

          <NavLink
            to="/analytics"
            id="nav-analytics"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            📊 <span>Analytics</span>
          </NavLink>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginLeft: 'var(--space-sm)' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--color-primary-soft)', color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem',
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              id="nav-logout"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
