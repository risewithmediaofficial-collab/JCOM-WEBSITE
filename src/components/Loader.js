import React from 'react';

const Loader = ({ size = 52, color = '#27a2de', label = '', inline = false }) => {
  return (
    <div
      className={inline ? 'jcom-loader-inline' : 'jcom-loader-block'}
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
    >
      <svg
        className="jcom-loader-spinner"
        viewBox="25 25 50 50"
        style={{ width: size, height: size }}
      >
        <circle
          className="jcom-loader-circle"
          r={20}
          cy={50}
          cx={50}
          style={{ stroke: color }}
        />
      </svg>
      {label ? <span className="jcom-loader-label">{label}</span> : null}
    </div>
  );
};

export default Loader;
