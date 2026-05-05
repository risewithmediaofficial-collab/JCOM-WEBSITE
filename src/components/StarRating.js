import React from 'react';
import { StarFilled, StarOutlined } from '@ant-design/icons';

const StarRating = ({
  value = 0,
  count = 0,
  interactive = false,
  onChange,
  size = 18,
  showValue = true,
  showCount = true
}) => {
  const roundedValue = Number(value) || 0;
  const activeValue = interactive ? roundedValue : Math.round(roundedValue);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeValue;
          const Icon = filled ? StarFilled : StarOutlined;

          if (!interactive) {
            return <Icon key={star} style={{ color: '#f5a623', fontSize: size }} />;
          }

          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Icon style={{ color: '#f5a623', fontSize: size }} />
            </button>
          );
        })}
      </div>

      {(showValue || showCount) && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {showValue ? roundedValue.toFixed(1) : ''}
          {showValue && showCount ? ' ' : ''}
          {showCount ? `(${count || 0})` : ''}
        </div>
      )}
    </div>
  );
};

export default StarRating;
