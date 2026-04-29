import React from 'react';

const StatCard = ({ value, label, icon, trend, trendValue, color = 'gold', prefix = '', suffix = '' }) => {
  const colorMap = {
    gold:   { border: 'var(--border-accent)', shadow: 'var(--shadow-gold)', bar: 'var(--grad-gold)' },
    teal:   { border: 'var(--border-teal)',   shadow: 'var(--shadow-teal)', bar: 'var(--grad-teal)' },
    purple: { border: 'rgba(124,58,237,0.3)', shadow: '0 0 20px rgba(124,58,237,0.25)', bar: 'var(--grad-purple)' },
    red:    { border: 'rgba(239,68,68,0.3)',  shadow: '0 0 20px rgba(239,68,68,0.2)',  bar: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  };
  const c = colorMap[color] || colorMap.gold;

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-card)',
      border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      transition: 'all 0.25s',
      cursor: 'default'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = c.shadow; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Top color bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.bar }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, animation: 'countUp 0.5s ease' }}>
            {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
          </div>
          {trend && (
            <div style={{ marginTop: 6, fontSize: '0.78rem', color: trend === 'up' ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${c.border.replace(')', ', 0.2)').replace('rgba', 'rgba')}, transparent)`,
            border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
