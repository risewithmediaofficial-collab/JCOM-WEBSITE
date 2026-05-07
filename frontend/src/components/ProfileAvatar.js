import React, { useEffect, useMemo, useState } from 'react';
import { buildAssetUrl } from '../config/api';

const ProfileAvatar = ({
  src,
  firstName = '',
  lastName = '',
  alt = 'Profile',
  size = 40,
  borderRadius = '50%',
  fontSize,
  color = '#000',
  background = 'var(--grad-gold)',
  border = 'none',
  textColor = '#000',
  imgStyle = {}
}) => {
  const imageUrl = useMemo(() => buildAssetUrl(src), [src]);
  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.trim() || 'U';

  useEffect(() => {
    if (!imageUrl) {
      setResolvedImageUrl(null);
      return undefined;
    }

    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (!cancelled) {
        setResolvedImageUrl(imageUrl);
      }
    };

    image.onerror = () => {
      if (!cancelled) {
        setResolvedImageUrl(null);
      }
    };

    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: fontSize || Math.max(12, Math.round(size * 0.4)),
        color: textColor,
        overflow: 'hidden',
        flexShrink: 0,
        border
      }}
    >
      {resolvedImageUrl ? (
        <img
          src={resolvedImageUrl}
          alt=""
          aria-label={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...imgStyle
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default ProfileAvatar;
