import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { API_BASE_URL } from '../config/api';

const emptyStats = { globalStats: { totalMembers: 0, totalConnections: 0, totalRevenue: 0 }, locations: [] };

const formatRevenue = (r) => {
  if (r >= 10000000) return `₹${(r / 10000000).toFixed(1)} Cr`;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)} L`;
  return `₹${r.toLocaleString('en-IN')}`;
};

const LocationsPerformancePage = () => {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get(`${API_BASE_URL}/stats/home?period=overall`);
        if (active) {
          setStats(data || emptyStats);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Could not load location performance');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      active = false;
    };
  }, []);

  const locations = useMemo(
    () => [...(stats.locations || [])].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0)),
    [stats.locations]
  );

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Navbar />

      <section style={{ padding: '112px 16px 56px', background: 'var(--bg-surface)' }}>
        <div className="section-shell">
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="badge badge-gold" style={{ marginBottom: 12 }}>Performance Dashboard</div>
              <h1 style={{ marginBottom: 10 }}>All Location-wise Performance</h1>
              <p style={{ maxWidth: 760 }}>
                View the complete performance list across every JCOM location, including members, connections, and revenue.
              </p>
            </div>
            <Link to="/" className="btn btn-ghost btn-sm">Back to Home</Link>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>📍 All Locations</h3>
              {error && (
                <span style={{ fontSize: '0.8rem', color: 'var(--error)', background: 'rgba(220,38,38,0.08)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(220,38,38,0.2)' }}>
                  ⚠️ {error}
                </span>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="jcom-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Location</th>
                    <th>Members</th>
                    <th>Connections</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3, 4, 5].map((row) => (
                      <tr key={row}>
                        {[1, 2, 3, 4, 5].map((cell) => (
                          <td key={cell}>
                            <div className="skeleton" style={{ height: 18, borderRadius: 4 }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : locations.length > 0 ? (
                    locations.map((loc, index) => (
                      <tr key={`${loc.name}-${index}`}>
                        <td><span className="badge badge-gold">#{index + 1}</span></td>
                        <td><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loc.name}</span></td>
                        <td><span className="badge badge-teal">{loc.members}</span></td>
                        <td>{Number(loc.connections || 0).toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatRevenue(Number(loc.revenue || 0))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        No locations have been set up yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LocationsPerformancePage;
