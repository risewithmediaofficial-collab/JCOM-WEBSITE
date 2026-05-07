import React, { useState, useEffect, useContext } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { AuthContext } from '../context/AuthContext';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

/**
 * SidebarLayout — wrap any authenticated page with this.
 * On desktop (≥769px): collapsible sidebar (220px / 64px).
 * On mobile (<769px):  sidebar hidden by default, slides in as overlay via hamburger.
 */
const SidebarLayout = ({ children, noPadding = false }) => {
  const { user } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 769;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // close drawer when resizing to desktop
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useBodyScrollLock(isMobile && mobileOpen);

  // Public pages — no sidebar
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Navbar />
        {children}
      </div>
    );
  }

  const sidebarW = collapsed ? 64 : 220;
  const mobileDrawerWidth = Math.min(window.innerWidth - 16, 280);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar — pass mobile toggle handler */}
      <Navbar
        sidebarWidth={isMobile ? 0 : sidebarW}
        onMobileMenuToggle={() => setMobileOpen(o => !o)}
        mobileMenuOpen={mobileOpen}
      />

      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 850,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar */}
      {isMobile ? (
        /* Mobile: slide-in drawer */
        <div style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 900,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          width: mobileDrawerWidth,
          maxWidth: 'calc(100vw - 16px)',
        }}>
          <Sidebar
            collapsed={false}
            onCollapse={null}
            onClose={() => setMobileOpen(false)}
            isMobileDrawer
            drawerWidth={mobileDrawerWidth}
          />
        </div>
      ) : (
        /* Desktop: pinned collapsible sidebar */
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      )}

      {/* Main content */}
      <main style={{
        marginLeft: isMobile ? 0 : sidebarW,
        paddingTop: 64,
        minHeight: '100vh',
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
        background: 'var(--bg-base)',
      }}>
        <div style={noPadding ? {} : {
          padding: isMobile ? '20px 16px 40px' : '32px 28px',
          maxWidth: 1300,
          margin: '0 auto',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
