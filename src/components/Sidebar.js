import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_ORIGIN } from '../config/api';

const Sidebar = ({ collapsed = false, onCollapse, onClose, isMobileDrawer = false }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  // Build nav links based on role
  const memberLinks = [
    { to: '/dashboard',   icon: '🏠', label: 'Dashboard'      },
    { to: '/connections', icon: '🔗', label: 'Connections'    },
    { to: '/crm',         icon: '📊', label: 'CRM Dashboard'  },
    { to: '/meetings',    icon: '📅', label: 'Meetings'       },
    { to: '/leaderboard', icon: '🏆', label: 'Leaderboard'    },
  ];

  const adminLinks = user.role === 'Super Admin'
    ? [{ to: '/super-admin', icon: '⚙️', label: 'Control Panel' }]
    : user.role === 'Chairman'
    ? [{ to: '/chairman',   icon: '👑', label: 'Chairman Panel' }]
    : [];

  const navLinks = [...adminLinks, ...memberLinks];

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');
  const W = collapsed ? 64 : 220;

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: isMobileDrawer ? 0 : 64,
      bottom: 0,
      width: isMobileDrawer ? 240 : (collapsed ? 64 : 220),
      zIndex: 900,
      background: '#ffffff',
      borderRight: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden'
    }}>

      {/* Mobile drawer header with close button */}
      {isMobileDrawer && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem', background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>JCOM</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', padding: 4 }}>✕</button>
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      {!isMobileDrawer && (
        <button
          onClick={() => onCollapse && onCollapse(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
            padding: '10px 14px', border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--text-muted)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            fontSize: '1rem', flexShrink: 0,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      )}

      {/* User mini-card */}
      {!collapsed && (
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--grad-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem', color: '#fff',
            marginBottom: 8, overflow: 'hidden',
            border: '2px solid var(--border-accent)'
          }}>
            {user.profilePic
              ? <img src={`${API_ORIGIN}${user.profilePic}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : `${user.firstName?.[0]}${user.lastName?.[0]}`
            }
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.firstName} {user.lastName}
          </div>
          {user.locationName && (
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📍 {user.locationName}
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.membershipId || user.role}
          </div>
        </div>
      )}

      {/* Collapsed avatar */}
      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff', overflow: 'hidden', border: '2px solid var(--border-accent)' }}>
            {user.profilePic
              ? <img src={`${API_ORIGIN}${user.profilePic}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : `${user.firstName?.[0]}${user.lastName?.[0]}`
            }
          </div>
        </div>
      )}

      {/* Navigation links */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 10px 8px' }}>
            Navigation
          </div>
        )}
        {navLinks.map(link => {
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '12px 0' : '10px 12px',
                borderRadius: 10, marginBottom: 4,
                textDecoration: 'none',
                background: active ? 'rgba(0,73,194,0.08)' : 'transparent',
                border: active ? '1px solid rgba(0,73,194,0.2)' : '1px solid transparent',
                transition: 'all 0.18s',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{link.icon}</span>
              {!collapsed && (
                <span style={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>
                  {link.label}
                </span>
              )}
              {!collapsed && active && (
                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role badge at bottom */}
      {!collapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ background: 'rgba(0,73,194,0.06)', border: '1px solid rgba(0,73,194,0.15)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {user.role}
              {user.subRole ? ` · ${user.subRole}` : ''}
            </div>
            {user.locationName && (
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.locationName}</div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
