import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  HomeOutlined, DashboardOutlined, TeamOutlined, AppstoreOutlined,
  CalendarOutlined, TrophyOutlined, MessageOutlined, UserOutlined,
  LogoutOutlined, MenuOutlined, CloseOutlined, BellOutlined,
  CrownOutlined, SearchOutlined, SettingOutlined
} from '@ant-design/icons';
import ProfileAvatar from './ProfileAvatar';

const Navbar = ({ sidebarWidth, onMobileMenuToggle, mobileMenuOpen }) => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  // Use external toggle when provided (authenticated pages via SidebarLayout)
  const menuOpen = onMobileMenuToggle ? mobileMenuOpen : internalMenuOpen;
  const toggleMenu = onMobileMenuToggle || (() => setInternalMenuOpen(o => !o));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = (role) => {
    const map = {
      'Super Admin': { label: 'Super Admin', cls: 'badge-purple' },
      'Chairman':    { label: 'Chairman', cls: 'badge-gold' },
      'Vice Chairman':{ label: 'Vice Chair', cls: 'badge-teal' },
      'Director':    { label: 'Director', cls: 'badge-info' },
      'Treasurer':   { label: 'Treasurer', cls: 'badge-success' },
      'Member':      { label: 'Member', cls: 'badge-ghost' }
    };
    return map[role] || { label: role, cls: 'badge-ghost' };
  };

  const getNavItems = () => {
    if (!isAuthenticated) return [];
    const base = [
      { to: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { to: '/connections', icon: <TeamOutlined />, label: 'Connections' },
      { to: '/crm', icon: <AppstoreOutlined />, label: 'CRM' },
      { to: '/meetings', icon: <CalendarOutlined />, label: 'Meetings' },
      { to: '/leaderboard', icon: <TrophyOutlined />, label: 'Leaderboard' },
    ];
    if (user?.role === 'Super Admin') {
      return [{ to: '/super-admin', icon: <SettingOutlined />, label: 'Admin' }, ...base];
    }
    if (user?.role === 'Chairman') {
      return [{ to: '/chairman', icon: <CrownOutlined />, label: 'Chairman' }, ...base];
    }
    return base;
  };

  const navItems = getNavItems();
  return (
    <nav style={styles.navbar}>
      <div style={styles.navInner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <div style={styles.logoIcon}><span style={{ fontSize: '1.2rem' }}>⚡</span></div>
          <span style={styles.logoText}>JCOM</span>
          <span style={styles.logoTagline}>Connecting Businesses</span>
        </Link>

        {/* Desktop Nav Links */}
        {isAuthenticated && (
          <div style={styles.navLinks} className="hide-mobile">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  ...styles.navLink,
                  ...(location.pathname === item.to ? styles.navLinkActive : {})
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Right Side */}
        <div style={styles.navRight}>
          {/* Search */}
          <Link to="/search" style={styles.iconBtn} title="Search Members">
            <SearchOutlined />
          </Link>

          {isAuthenticated ? (
            <>
              {/* Notification */}
              <div style={{ ...styles.iconBtn, position: 'relative' }}>
                <BellOutlined />
              </div>

              {/* User Profile */}
              <div style={styles.profileSection}>
                <ProfileAvatar
                  src={user?.profilePic}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  alt="Profile"
                  size={28}
                  borderRadius="50%"
                  fontSize={12}
                />
                <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user?.firstName} {user?.lastName?.charAt(0)}.
                  </span>
                  <span className={`badge ${getRoleBadge(user?.role).cls}`} style={{ fontSize: '0.55rem', padding: '1px 6px' }}>
                    {getRoleBadge(user?.role).label}
                  </span>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
                  <LogoutOutlined />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}

          {/* Mobile Menu toggle */}
          <button
            style={styles.mobileMenuBtn}
            className="hide-desktop"
            onClick={toggleMenu}
          >
            {menuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown — only shown when NOT using external sidebar drawer */}
      {!onMobileMenuToggle && menuOpen && (
        <div style={styles.mobileMenu} className="hide-desktop">
          {!isAuthenticated ? (
            <>
              <Link to="/login" style={styles.mobileNavLink} onClick={() => setInternalMenuOpen(false)}>Login</Link>
              <Link to="/register" style={styles.mobileNavLink} onClick={() => setInternalMenuOpen(false)}>Register</Link>
            </>
          ) : (
            navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={styles.mobileNavLink}
                onClick={() => setInternalMenuOpen(false)}
              >
                {item.icon} {item.label}
              </Link>
            ))
          )}
          {isAuthenticated && (
            <button onClick={handleLogout} style={{ ...styles.mobileNavLink, background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              <LogoutOutlined /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

const styles = {
  navbar: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    background: '#ffffff',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 1px 12px rgba(0,0,0,0.07)',
    height: '64px'
  },
  navInner: {
    maxWidth: '1400px', margin: '0 auto',
    height: '64px', padding: '0 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'var(--grad-gold)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  logoText: {
    fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.3rem',
    background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  },
  logoTagline: {
    fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.5px'
  },
  navLinks: {
    display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center'
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    borderRadius: '8px', color: '#4a5568', fontSize: '0.88rem', fontWeight: 500,
    textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap'
  },
  navLinkActive: {
    background: 'rgba(0,73,194,0.08)', color: '#0049c2',
    border: '1px solid rgba(0,73,194,0.2)'
  },
  navRight: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-secondary)', cursor: 'pointer',
    textDecoration: 'none', fontSize: '1rem',
    transition: 'all 0.2s'
  },
  profileSection: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#f8f9fc', borderRadius: 8,
    border: '1px solid rgba(0,0,0,0.08)', padding: '4px 8px'
  },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2px 4px',
    borderRadius: 4, display: 'flex', alignItems: 'center',
    transition: 'color 0.2s'
  },
  mobileMenuBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-primary)', fontSize: '1.2rem'
  },
  mobileMenu: {
    background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.08)',
    padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4
  },
  mobileNavLink: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', borderRadius: 8, color: 'var(--text-secondary)',
    fontSize: '0.95rem', textDecoration: 'none', transition: 'all 0.2s'
  }
};

export default Navbar;

