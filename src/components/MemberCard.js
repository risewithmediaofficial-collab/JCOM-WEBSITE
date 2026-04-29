import React from 'react';
import { GlobalOutlined, InfoCircleOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';

const roleBadge = {
  'Vice Chairman': 'badge-teal',
  Director: 'badge-info',
  Treasurer: 'badge-success'
};

const MemberCard = ({ member, onConnect, onInfo, isConnected, isPending }) => {
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;
  const displayName = `${member.firstName} ${member.lastName}`;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--grad-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem',
            color: '#000',
            flexShrink: 0,
            overflow: 'hidden'
          }}
        >
          {member.profilePic ? (
            <img
              src={`http://localhost:5000${member.profilePic}`}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap'
            }}
          >
            <span className="truncate">{displayName}</span>
            {member.subRole && (
              <span className={`badge ${roleBadge[member.subRole] || 'badge-info'}`}>
                {member.subRole}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>
            {member.businessCategory}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {member.locationName} • {member.tableName}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {member.businessName}
      </div>

      {member.businessDescription && (
        <p
          style={{
            fontSize: '0.82rem',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {member.businessDescription}
        </p>
      )}

      <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {member.totalConnections || 0}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Connects
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
            Rs.
            {member.totalRevenue >= 100000
              ? `${(member.totalRevenue / 100000).toFixed(1)}L`
              : (member.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Revenue
          </div>
        </div>
        {member.businessWebsite && (
          <a
            href={member.businessWebsite}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '1rem' }}
          >
            <GlobalOutlined />
          </a>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {onInfo && (
          <button
            onClick={() => onInfo(member)}
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: 'center', flex: 1 }}
          >
            <InfoCircleOutlined /> Info
          </button>
        )}
        {onConnect && !isConnected && !isPending && (
          <button
            onClick={() => onConnect(member)}
            className="btn btn-primary btn-sm"
            style={{ justifyContent: 'center', flex: 1 }}
          >
            <PlusOutlined /> Connect
          </button>
        )}
      </div>

      {isPending && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px',
            background: 'rgba(245,158,11,0.08)',
            borderRadius: 10,
            border: '1px solid rgba(245,158,11,0.25)',
            fontSize: '0.85rem',
            color: 'var(--primary)',
            fontWeight: 600
          }}
        >
          <LinkOutlined /> Request Sent
        </div>
      )}
      {isConnected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px',
            background: 'rgba(34,197,94,0.08)',
            borderRadius: 10,
            border: '1px solid rgba(34,197,94,0.25)',
            fontSize: '0.85rem',
            color: 'var(--success)',
            fontWeight: 600
          }}
        >
          <LinkOutlined /> Connected
        </div>
      )}
    </div>
  );
};

export default MemberCard;
