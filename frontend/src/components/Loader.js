import React from 'react';

const Loader = ({
  label = '',
  inline = false,
  minHeight = inline ? 'auto' : 'clamp(120px, 22vw, 180px)'
}) => {
  const displayLabel = label || 'Loading...';

  return (
    <div
      className={inline ? 'jcom-loader-inline' : 'jcom-loader-block'}
      role="status"
      aria-live="polite"
      aria-label={displayLabel}
      style={{
        '--jcom-loader-min-height': minHeight
      }}
    >
      <span className="jcom-loader-label">{displayLabel}</span>
    </div>
  );
};

export default Loader;
