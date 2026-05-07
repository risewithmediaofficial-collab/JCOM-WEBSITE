import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  HomeOutlined, DashboardOutlined, TeamOutlined, AppstoreOutlined,
  CalendarOutlined, TrophyOutlined, InfoCircleOutlined,
  LogoutOutlined, MenuOutlined, CloseOutlined, BellOutlined,
  CrownOutlined, SearchOutlined, SettingOutlined
} from '@ant-design/icons';
import ProfileAvatar from './ProfileAvatar';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const brandLogoSrc = `${process.env.PUBLIC_URL}/Logo%20jcom.png`;

const scrollPageToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

const Navbar = ({ onMobileMenuToggle, mobileMenuOpen }) => {
  const {
    user,
    isAuthenticated,
    logout,
    unreadNotificationCount,
    notificationPermission,
    enableNotifications
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth < 769);

  const menuOpen = onMobileMenuToggle ? mobileMenuOpen : internalMenuOpen;
  const toggleMenu = onMobileMenuToggle || (() => setInternalMenuOpen((open) => !open));

  useBodyScrollLock(!onMobileMenuToggle && menuOpen);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 769);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationClick = async () => {
    if (notificationPermission !== 'granted') {
      await enableNotifications();
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      'Super Admin': { label: 'Super Admin', cls: 'badge-purple' },
      'Chairman': { label: 'Chairman', cls: 'badge-gold' },
      'Vice Chairman': { label: 'Vice Chair', cls: 'badge-teal' },
      'Director': { label: 'Director', cls: 'badge-info' },
      'Treasurer': { label: 'Treasurer', cls: 'badge-success' },
      'Member': { label: 'Member', cls: 'badge-ghost' }
    };
    return map[role] || { label: role, cls: 'badge-ghost' };
  };

  const getNavItems = () => {
    const publicItems = [
      { to: '/', icon: <HomeOutlined />, label: 'Home' },
      { to: '/about', icon: <InfoCircleOutlined />, label: 'About' },
      { to: '/events', icon: <CalendarOutlined />, label: 'Events' }
    ];

    if (!isAuthenticated) return publicItems;

    const memberItems = [
      { to: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { to: '/connections', icon: <TeamOutlined />, label: 'Connections' },
      { to: '/crm', icon: <AppstoreOutlined />, label: 'CRM' },
      { to: '/meetings', icon: <CalendarOutlined />, label: 'Meetings' },
      { to: '/leaderboard', icon: <TrophyOutlined />, label: 'Leaderboard' }
    ];

    if (user?.role === 'Super Admin') {
      return [...publicItems, { to: '/super-admin', icon: <SettingOutlined />, label: 'Admin' }, ...memberItems];
    }
    if (user?.role === 'Chairman') {
      return [...publicItems, { to: '/chairman', icon: <CrownOutlined />, label: 'Chairman' }, ...memberItems];
    }
    return [...publicItems, ...memberItems];
  };

  const navItems = getNavItems();
  const showCompactMobileHeader = isMobileViewport;
  const showInlineGuestActions = !isAuthenticated && !showCompactMobileHeader;
  const showSearchShortcut = !showCompactMobileHeader;
  const showNotificationShortcut = isAuthenticated && !showCompactMobileHeader;

  return (
    <nav style={styles.navbar}>
      <div style={{ ...styles.navInner, ...(showCompactMobileHeader ? styles.navInnerMobile : {}) }}>
        <Link to="/" style={{ ...styles.logo, ...(showCompactMobileHeader ? styles.logoMobile : {}) }}>
          <img
            src={brandLogoSrc}
            alt="JCOM"
            style={{ ...styles.logoImage, ...(showCompactMobileHeader ? styles.logoImageMobile : {}) }}
          />
        </Link>

        <div style={styles.navLinks} className="hide-mobile">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={scrollPageToTop}
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

        <div style={{ ...styles.navRight, ...(showCompactMobileHeader ? styles.navRightMobile : {}) }}>
          {showSearchShortcut && (
            <Link to="/search" style={styles.iconBtn} title="Search Members">
              <SearchOutlined />
            </Link>
          )}

          {isAuthenticated ? (
            <>
              {showNotificationShortcut && (
                <button
                  type="button"
                  onClick={handleNotificationClick}
                  style={{ ...styles.iconBtn, ...styles.notificationBtn, position: 'relative' }}
                  title={notificationPermission === 'granted' ? 'Notifications enabled' : 'Enable browser notifications'}
                >
                  <BellOutlined />
                  {unreadNotificationCount > 0 && (
                    <span style={styles.notificationBadge}>
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
              )}

              <div style={{ ...styles.profileSection, ...(showCompactMobileHeader ? styles.profileSectionMobile : {}) }}>
                <Link
                  to={user?._id ? `/profile/${user._id}` : '/dashboard'}
                  style={{ ...styles.profileLink, textDecoration: 'none' }}
                >
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
                </Link>
                <button
                  onClick={handleLogout}
                  style={{ ...styles.logoutBtn, ...(showCompactMobileHeader ? styles.logoutBtnMobile : {}) }}
                  title="Logout"
                >
                  <LogoutOutlined />
                </button>
              </div>
            </>
          ) : (
            showInlineGuestActions && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )
          )}

          <button
            style={{ ...styles.mobileMenuBtn, ...(showCompactMobileHeader ? styles.mobileMenuBtnMobile : {}) }}
            className="hide-desktop"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </div>
      </div>

      {!onMobileMenuToggle && menuOpen && (
        <div style={styles.mobileMenu} className="hide-desktop">
          <Link
            to="/search"
            style={styles.mobileNavLink}
            onClick={() => {
              scrollPageToTop();
              setInternalMenuOpen(false);
            }}
          >
            <SearchOutlined /> Search
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={styles.mobileNavLink}
              onClick={() => {
                scrollPageToTop();
                setInternalMenuOpen(false);
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <>
              <Link to="/login" style={styles.mobileNavLink} onClick={() => { scrollPageToTop(); setInternalMenuOpen(false); }}>Login</Link>
              <Link to="/register" style={styles.mobileNavLink} onClick={() => { scrollPageToTop(); setInternalMenuOpen(false); }}>Register</Link>
            </>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              style={{ ...styles.mobileNavLink, background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
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
  navInnerMobile: {
    padding: '0 12px',
    gap: 8
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0
  },
  logoMobile: {
    gap: 8,
    minWidth: 0
  },
  logoImage: {
    height: 44,
    width: 'auto',
    display: 'block',
    objectFit: 'contain',
    flexShrink: 0
  },
  logoImageMobile: {
    height: 38
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
    background: 'rgba(39,162,222,0.08)', color: '#27a2de',
    border: '1px solid rgba(39,162,222,0.2)'
  },
  navRight: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto'
  },
  navRightMobile: {
    gap: 6,
    minWidth: 0
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
  notificationBtn: {
    padding: 0
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    padding: '0 4px',
    borderRadius: 999,
    background: 'var(--error)',
    color: '#ffffff',
    fontSize: '0.62rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.16)'
  },
  profileSection: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#f8f9fc', borderRadius: 8,
    border: '1px solid rgba(0,0,0,0.08)', padding: '4px 8px',
    minWidth: 0
  },
  profileSectionMobile: {
    gap: 4,
    padding: '3px 4px'
  },
  profileLink: {
    display: 'flex', alignItems: 'center', gap: 6,
    minHeight: 32,
    minWidth: 0
  },
  logoutBtn: {
    width: 32, height: 32,
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '0.9rem', padding: 0,
    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderLeft: '1px solid rgba(0,0,0,0.08)',
    marginLeft: 2, paddingLeft: 6,
    transition: 'color 0.2s',
    flexShrink: 0
  },
  logoutBtnMobile: {
    width: 28,
    height: 28,
    marginLeft: 0,
    paddingLeft: 0,
    borderLeft: 'none'
  },
  mobileMenuBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-primary)', fontSize: '1.2rem'
  },
  mobileMenuBtnMobile: {
    width: 36,
    height: 36,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
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
