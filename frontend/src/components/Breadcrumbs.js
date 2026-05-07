import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumbs = ({ items = [] }) => (
  <nav aria-label="Breadcrumb" style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {item.to && !isLast ? (
              <Link
                to={item.to}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: isLast ? 700 : 600,
                  color: isLast ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
              >
                {item.label}
              </span>
            )}
            {!isLast && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>/</span>}
          </React.Fragment>
        );
      })}
    </div>
  </nav>
);

export default Breadcrumbs;
