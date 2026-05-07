import React from 'react';

const Loader = ({
  size = 'clamp(2.6rem, 7vw, 3.25rem)',
  color = '#27a2de',
  label = '',
  inline = false,
  minHeight = inline ? 'auto' : 'clamp(120px, 22vw, 180px)'
}) => {
  return (
    <div
      className={inline ? 'jcom-loader-inline' : 'jcom-loader-block'}
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
      style={{
        '--jcom-loader-size': typeof size === 'number' ? `${size}px` : size,
        '--jcom-loader-color': color,
        '--jcom-loader-min-height': minHeight
      }}
    >
      <svg
        className="jcom-loader-spinner"
        viewBox="25 25 50 50"
      >
        <circle
          className="jcom-loader-circle"
          r={20}
          cy={50}
          cx={50}
        />
      </svg>
      {label ? <span className="jcom-loader-label">{label}</span> : null}
    </div>
  );
};

export default Loader;
