import React, { useMemo, useState } from 'react';
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
  const [imgError, setImgError] = useState(false);
  const imageUrl = useMemo(() => buildAssetUrl(src), [src]);
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.trim() || 'U';

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
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={alt}
          onError={() => setImgError(true)}
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
