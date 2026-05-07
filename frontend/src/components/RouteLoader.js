import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loader from './Loader';

const RouteLoader = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 420);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        style={{
          width: 'min(100%, 220px)',
          padding: '26px 22px',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(39,162,222,0.12)',
          boxShadow: '0 20px 40px rgba(15,23,42,0.08)'
        }}
      >
        <Loader label="Loading page" minHeight="auto" />
      </div>
    </div>
  );
};

export default RouteLoader;
