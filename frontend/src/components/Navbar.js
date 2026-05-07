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
        <div style={styles.mobileMenuOverlay} className="hide-desktop">
          <div style={styles.mobileMenu}>
            <div style={styles.mobileMenuHeader}>
              <Link
                to="/"
                style={styles.mobileMenuBrand}
                onClick={() => {
                  scrollPageToTop();
                  setInternalMenuOpen(false);
                }}
              >
                <img src={brandLogoSrc} alt="JCOM" style={styles.mobileMenuBrandImage} />
              </Link>
              <button
                type="button"
                onClick={() => setInternalMenuOpen(false)}
                style={styles.mobileMenuCloseBtn}
                aria-label="Close menu"
              >
                <CloseOutlined />
              </button>
            </div>

            <div style={styles.mobileMenuBody}>
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
                  style={{
                    ...styles.mobileNavLink,
                    ...(location.pathname === item.to ? styles.mobileNavLinkActive : {})
                  }}
                  onClick={() => {
                    scrollPageToTop();
                    setInternalMenuOpen(false);
                  }}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleNotificationClick}
                  style={{
                    ...styles.mobileNotificationCard,
                    ...(notificationPermission === 'granted' ? styles.mobileNotificationCardEnabled : {})
                  }}
                >
                  <span style={styles.mobileNotificationIconWrap}>
                    <BellOutlined />
                    {unreadNotificationCount > 0 && (
                      <span style={styles.mobileNotificationBadge}>
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                    <span style={styles.mobileNotificationTitle}>
                      {notificationPermission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
                    </span>
                    <span style={styles.mobileNotificationSubtitle}>
                      {notificationPermission === 'granted'
                        ? 'Get live alerts for requests, messages, and approvals.'
                        : 'Turn on browser alerts for requests, messages, and approvals.'}
                    </span>
                  </span>
                </button>
              )}
            </div>

            <div style={styles.mobileMenuFooter}>
              {!isAuthenticated && (
                <div style={styles.mobileActionGroup}>
                  <Link
                    to="/login"
                    style={{ ...styles.mobileActionBtn, ...styles.mobileActionBtnGhost }}
                    onClick={() => { scrollPageToTop(); setInternalMenuOpen(false); }}
                  >
                    <span style={styles.mobileActionEyebrow}>Member Access</span>
                    <span style={styles.mobileActionLabel}>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    style={{ ...styles.mobileActionBtn, ...styles.mobileActionBtnPrimary }}
                    onClick={() => { scrollPageToTop(); setInternalMenuOpen(false); }}
                  >
                    <span style={styles.mobileActionEyebrow}>New to JCOM?</span>
                    <span style={styles.mobileActionLabel}>Register</span>
                  </Link>
                </div>
              )}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  style={{ ...styles.mobileNavLink, ...styles.mobileLogoutBtn }}
                >
                  <LogoutOutlined /> Logout
                </button>
              )}
            </div>
          </div>
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
  mobileMenuOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1100,
    background: 'rgba(12, 18, 32, 0.34)',
    backdropFilter: 'blur(6px)',
    overflow: 'hidden'
  },
  mobileMenu: {
    width: '100%',
    height: '100dvh',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)',
    padding: '16px 16px max(16px, env(safe-area-inset-bottom))',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    animation: 'slideInLeft 0.28s ease forwards'
  },
  mobileMenuHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  mobileMenuBrand: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: 0
  },
  mobileMenuBrandImage: {
    height: 34,
    width: 'auto',
    display: 'block',
    objectFit: 'contain'
  },
  mobileMenuCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: '1px solid rgba(39,162,222,0.14)',
    background: 'rgba(255,255,255,0.88)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.05rem',
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(15,23,42,0.06)'
  },
  mobileMenuBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: '0 0 auto',
    overflowY: 'visible',
    paddingRight: 2,
    paddingBottom: 0
  },
  mobileNavLink: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '14px 16px',
    borderRadius: 18,
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s',
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(15,23,42,0.06)',
    boxShadow: '0 8px 22px rgba(15,23,42,0.04)'
  },
  mobileNavLinkActive: {
    color: 'var(--primary)',
    border: '1px solid rgba(39,162,222,0.24)',
    background: 'linear-gradient(135deg, rgba(39,162,222,0.1) 0%, rgba(255,255,255,0.98) 100%)',
    boxShadow: '0 12px 26px rgba(39,162,222,0.1)'
  },
  mobileActionGroup: {
    display: 'grid',
    gap: 10,
    marginTop: 0
  },
  mobileMenuFooter: {
    display: 'grid',
    gap: 10,
    marginTop: 8,
    paddingTop: 4,
    paddingBottom: 2,
    position: 'static',
    background: 'transparent'
  },
  mobileActionBtn: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '14px 16px',
    borderRadius: 18,
    textDecoration: 'none',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    minHeight: 72
  },
  mobileActionBtnGhost: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(241,244,249,0.98) 100%)',
    border: '1px solid rgba(39,162,222,0.16)',
    boxShadow: '0 10px 24px rgba(15,23,42,0.06)',
    color: 'var(--text-primary)'
  },
  mobileActionBtnPrimary: {
    background: 'linear-gradient(135deg, #27a2de 0%, #1e7fb0 100%)',
    border: '1px solid rgba(39,162,222,0.28)',
    boxShadow: '0 14px 30px rgba(39,162,222,0.28)',
    color: '#ffffff',
    animation: 'pulse-glow 2.8s ease-in-out infinite'
  },
  mobileActionEyebrow: {
    fontSize: '0.68rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 800,
    opacity: 0.78
  },
  mobileActionLabel: {
    fontSize: '1rem',
    fontWeight: 800,
    lineHeight: 1.1
  },
  mobileNotificationCard: {
    marginTop: 8,
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 18,
    border: '1px solid rgba(39,162,222,0.14)',
    background: 'linear-gradient(135deg, rgba(247,251,255,1) 0%, rgba(255,255,255,1) 100%)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 10px 24px rgba(15,23,42,0.05)'
  },
  mobileLogoutBtn: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.18)',
    color: 'var(--error)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left'
  },
  mobileNotificationCardEnabled: {
    border: '1px solid rgba(22,163,74,0.18)',
    background: 'linear-gradient(135deg, rgba(240,253,244,1) 0%, rgba(255,255,255,1) 100%)'
  },
  mobileNotificationIconWrap: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(39,162,222,0.18) 0%, rgba(39,162,222,0.06) 100%)',
    color: 'var(--primary)',
    fontSize: '1rem'
  },
  mobileNotificationBadge: {
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
    justifyContent: 'center'
  },
  mobileNotificationTitle: {
    fontSize: '0.95rem',
    fontWeight: 800,
    lineHeight: 1.2
  },
  mobileNotificationSubtitle: {
    fontSize: '0.78rem',
    lineHeight: 1.45,
    color: 'var(--text-secondary)'
  }
};

export default Navbar;
