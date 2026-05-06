import React from 'react';

const StatCard = ({ value, label, icon, trend, trendValue, color = 'gold', prefix = '', suffix = '' }) => {
  const colorMap = {
    gold: { bar: 'var(--grad-gold)', progress: 72 },
    teal: { bar: 'var(--grad-teal)', progress: 78 },
    purple: { bar: 'var(--grad-purple)', progress: 84 },
    red: { bar: 'linear-gradient(135deg,#ef4444,#dc2626)', progress: 66 }
  };

  const c = colorMap[color] || colorMap.gold;
  const formattedValue = `${prefix}${typeof value === 'number' ? value.toLocaleString('en-IN') : value}${suffix}`;

  const inferProgress = () => {
    if (typeof value === 'string') {
      const ratioMatch = value.match(/(\d+)\s*\/\s*(\d+)/);
      if (ratioMatch) {
        const current = Number(ratioMatch[1]);
        const total = Number(ratioMatch[2]) || 1;
        return Math.max(8, Math.min(100, Math.round((current / total) * 100)));
      }

      const percentMatch = value.match(/(\d+(?:\.\d+)?)%/);
      if (percentMatch) {
        return Math.max(8, Math.min(100, Math.round(Number(percentMatch[1]))));
      }
    }

    return c.progress;
  };

  const progress = inferProgress();
  const helperText = trendValue || (trend === 'up' ? 'Trending upward' : trend === 'down' ? 'Needs attention' : 'Live network snapshot');
  const metaLabel = trend
    ? `${trend === 'up' ? 'Up' : 'Down'} ${helperText}`
    : `${progress}% visual completion`;

  return (
    <article className={`modern-stat-card modern-stat-card--${color}`}>
      <div className="modern-stat-card__top">
        <div className="modern-stat-card__badge" aria-hidden="true">
          {icon || '•'}
        </div>
      </div>

      <div className="modern-stat-card__body">
        <div className="modern-stat-card__eyebrow">Dashboard metric</div>
        <div className="modern-stat-card__title">{label}</div>
        <div className="modern-stat-card__subtitle">{helperText}</div>
        <div className="modern-stat-card__value">{formattedValue}</div>
      </div>

      <div className="modern-stat-card__footer">
        <div className="modern-stat-card__meta">
          <span>{label}</span>
          <strong>{metaLabel}</strong>
        </div>
        <div className="modern-stat-card__progress" aria-hidden="true">
          <span style={{ width: `${progress}%`, background: c.bar }} />
        </div>
      </div>
    </article>
  );
};

export default StatCard;
