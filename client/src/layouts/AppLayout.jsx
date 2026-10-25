import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Dropdown from 'react-bootstrap/Dropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';

const NAV_ITEMS = {
  hr: [
    { label: 'Dashboard', path: '/hr', icon: 'bi-grid-1x2' },
    { label: 'Employees', path: '/employees', icon: 'bi-people' },
    { label: 'Departments', path: '/departments', icon: 'bi-building' },
    { label: 'Attendance', path: '/attendance', icon: 'bi-clock-history' },
    { label: 'Leave Requests', path: '/leaves', icon: 'bi-calendar-check' },
    { label: 'Training', path: '/trainings', icon: 'bi-mortarboard' },
    { label: 'Announcements', path: '/announcements', icon: 'bi-megaphone' },
    { label: 'My Profile', path: '/profile', icon: 'bi-person-circle' },
  ],
  manager: [
    { label: 'Dashboard', path: '/manager', icon: 'bi-grid-1x2' },
    { label: 'My Team', path: '/team', icon: 'bi-people' },
    { label: 'Team Attendance', path: '/attendance/team', icon: 'bi-clock-history' },
    { label: 'Team Leaves', path: '/leaves/team', icon: 'bi-calendar-check' },
    { label: 'Training', path: '/trainings', icon: 'bi-mortarboard' },
    { label: 'Announcements', path: '/announcements', icon: 'bi-megaphone' },
    { label: 'My Profile', path: '/profile', icon: 'bi-person-circle' },
  ],
  employee: [
    { label: 'Dashboard', path: '/employee', icon: 'bi-grid-1x2' },
    { label: 'My Leaves', path: '/leaves/my', icon: 'bi-calendar-check' },
    { label: 'My Attendance', path: '/attendance/my', icon: 'bi-clock-history' },
    { label: 'Announcements', path: '/announcements', icon: 'bi-megaphone' },
    { label: 'My Training', path: '/trainings/my', icon: 'bi-mortarboard' },
    { label: 'My Profile', path: '/profile', icon: 'bi-person-circle' },
  ],
};

const ROLE_COLORS = {
  hr: 'bg-primary-subtle text-primary border border-primary-subtle',
  manager: 'bg-info-subtle text-info border border-info-subtle',
  employee: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || 'employee';
  const navList = NAV_ITEMS[role] || NAV_ITEMS.employee;

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'info');
      navigate('/login');
    } catch (err) {
      navigate('/login');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderNavLinks = () => (
    <ul className="nav nav-pills flex-column gap-1 mb-auto px-2">
      {navList.map((item) => (
        <li className="nav-item" key={item.path}>
          <NavLink
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary ${
                isActive ? 'active bg-primary text-white shadow-sm' : 'hover-bg-light'
              }`
            }
          >
            <i className={`bi ${item.icon} fs-5`}></i>
            <span className="fw-medium small">{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Desktop Sidebar */}
      <aside className="d-none d-lg-flex flex-column flex-shrink-0 bg-white border-end" style={{ width: '260px' }}>
        <div className="p-3 border-bottom d-flex align-items-center gap-3">
          <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '38px', height: '38px' }}>
            <i className="bi bi-people-fill fs-5"></i>
          </div>
          <div>
            <h6 className="fw-bold mb-0 text-dark">StaffSync</h6>
            <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
              HRM System
            </small>
          </div>
        </div>

        <div className="flex-grow-1 overflow-y-auto py-3">
          <div className="px-3 mb-2 text-uppercase text-muted fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
            Menu ({role.toUpperCase()})
          </div>
          {renderNavLinks()}
        </div>

        <div className="p-3 border-top bg-light-subtle">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', minWidth: '36px' }}>
              {getInitials(user?.name)}
            </div>
            <div className="flex-grow-1 overflow-hidden">
              <div className="fw-semibold text-truncate small">{user?.name}</div>
              <span className={`badge rounded-pill ${ROLE_COLORS[role]} py-0 px-2`} style={{ fontSize: '0.68rem' }}>
                {role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas show={mobileOpen} onHide={() => setMobileOpen(false)} responsive="lg" className="bg-white">
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-people-fill fs-6"></i>
            </div>
            <span className="fw-bold">StaffSync</span>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column p-0">
          <div className="flex-grow-1 overflow-y-auto py-3">
            <div className="px-3 mb-2 text-uppercase text-muted fw-semibold" style={{ fontSize: '0.68rem' }}>
              Menu ({role.toUpperCase()})
            </div>
            {renderNavLinks()}
          </div>
          <div className="p-3 border-top bg-light-subtle">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px' }}>
                {getInitials(user?.name)}
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-semibold text-truncate small">{user?.name}</div>
                <div className="text-muted small text-truncate">{user?.email}</div>
              </div>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content Column */}
      <div className="flex-grow-1 d-flex flex-column min-w-0">
        {/* Topbar */}
        <header className="navbar navbar-expand bg-white border-bottom px-3 px-lg-4 py-2 sticky-top">
          <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-secondary d-lg-none p-1 px-2 border-0"
                onClick={() => setMobileOpen(true)}
                aria-label="Toggle navigation"
              >
                <i className="bi bi-list fs-4"></i>
              </button>
              <div className="d-none d-sm-block text-muted small">
                {user?.department?.name ? (
                  <span>
                    <i className="bi bi-building me-1"></i>
                    {user.department.name}
                  </span>
                ) : (
                  <span>StaffSync Portal</span>
                )}
              </div>
            </div>

            {/* Right side items */}
            <div className="d-flex align-items-center gap-3">
              <Dropdown align="end">
                <Dropdown.Toggle
                  as="button"
                  id="user-menu-dropdown"
                  className="btn btn-light d-flex align-items-center gap-2 border-0 bg-transparent py-1 px-2 rounded-3"
                >
                  <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
                    {getInitials(user?.name)}
                  </div>
                  <span className="d-none d-md-inline fw-semibold small text-dark">{user?.name}</span>
                  <i className="bi bi-chevron-down small text-muted"></i>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow-sm border-0 rounded-3 mt-1 py-2">
                  <div className="px-3 py-1 mb-1">
                    <div className="fw-semibold small text-dark">{user?.name}</div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
                      {user?.email}
                    </div>
                  </div>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => navigate('/profile')} className="small py-2">
                    <i className="bi bi-person me-2 text-muted"></i> My Profile
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => navigate('/change-password')} className="small py-2">
                    <i className="bi bi-key me-2 text-muted"></i> Change Password
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="small py-2 text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i> Sign Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow-1 p-3 p-lg-4 overflow-y-auto">
          <div className="container-fluid p-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
