import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/team', label: 'Team' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Team Task Manager</p>
          <h1 className="brand-title">Command Center</h1>
          <p className="brand-copy">Projects, tasks, and team progress in one place.</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <div>
            <p className="sidebar-label">Signed in as</p>
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
          </div>
          <span className={`role-pill ${user?.role === 'ADMIN' ? 'admin' : 'member'}`}>{user?.role}</span>
          <button type="button" className="button ghost full-width" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}