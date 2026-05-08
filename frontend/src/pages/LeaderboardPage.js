import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('revenue');
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API}/stats/leaderboard?by=${sortBy}&period=${period}`);
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      setError(true);
      setLeaderboard([]);
    }
    setLoading(false);
  }, [sortBy, period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const periodLabel = period === 'weekly'
    ? 'This Week'
    : period === 'yearly'
      ? 'This Year'
      : 'This Month';

  const formatRevenue = (value) => {
    if (value >= 10000000) return `Rs.${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `Rs.${(value / 100000).toFixed(1)} L`;
    return `Rs.${(value || 0).toLocaleString('en-IN')}`;
  };

  const getRevenueValue = (location) => (
    period === 'overall' ? (location.totalRevenue || 0) : (location.periodRevenue || 0)
  );

  const getConnectionsValue = (location) => (
    period === 'overall' ? (location.totalConnections || 0) : (location.periodConnections || 0)
  );

  const medals = ['🥇', '🥈', '🥉'];
  const medalColors = ['#f5a623', '#94a3b8', '#b45309'];

  return (
    <SidebarLayout>
      <div className="page-shell" style={{ paddingTop: 'clamp(16px, 3vw, 32px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="badge badge-gold mb-md" style={{ margin: '0 auto 12px' }}>Rankings</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Location Leaderboard</h2>
          <p>Which locations are generating the most business connections? Updated automatically.</p>
        </div>

        <div className="responsive-actions filter-pills" style={{ justifyContent: 'center', marginBottom: 32 }}>
          <div className="filter-pills-group" style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', padding: 4, borderRadius: 30, border: '1px solid var(--border)' }}>
            {[
              { key: 'revenue', label: 'Revenue' },
              { key: 'connections', label: 'Connections' },
              { key: 'members', label: 'Members' },
              { key: 'attendance', label: 'Attendance' }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setSortBy(item.key)}
                className={`btn btn-sm ${sortBy === item.key ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 24 }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="filter-pills-group" style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', padding: 4, borderRadius: 30, border: '1px solid var(--border)' }}>
            {['weekly', 'monthly', 'yearly'].map((item) => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={`btn btn-sm ${period === item ? 'btn-teal' : 'btn-ghost'}`}
                style={{ borderRadius: 24 }}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {!loading && leaderboard.length >= 3 && (
          <div className="podium-grid" style={{ marginBottom: 40 }}>
            <div className="glass-card podium-card" style={{ padding: 24, borderColor: 'rgba(148,163,184,0.4)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{medals[1]}</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{leaderboard[1].name}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Chairman: {leaderboard[1].chairman}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8' }}>
                {formatRevenue(getRevenueValue(leaderboard[1]))}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Revenue</div>
            </div>

            <div className="glass-card-gold podium-card podium-card-featured" style={{ padding: 28 }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>{medals[0]}</div>
              <div className="badge badge-gold mb-md" style={{ margin: '0 auto 8px' }}>Top Location</div>
              <h3 style={{ color: 'var(--primary)', marginBottom: 4 }}>{leaderboard[0].name}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Chairman: {leaderboard[0].chairman}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                {formatRevenue(getRevenueValue(leaderboard[0]))}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Revenue Generated</div>
              <div className="grid-2" style={{ marginTop: 16, gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{getConnectionsValue(leaderboard[0])}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Connections</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{leaderboard[0].attendanceRate}%</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Attendance</div>
                </div>
              </div>
            </div>

            <div className="glass-card podium-card" style={{ padding: 24, borderColor: 'rgba(180,83,9,0.4)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{medals[2]}</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{leaderboard[2].name}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Chairman: {leaderboard[2].chairman}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#b45309' }}>
                {formatRevenue(getRevenueValue(leaderboard[2]))}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Revenue</div>
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Full Rankings - {periodLabel}</h4>
          </div>

          <div className="leaderboard-mobile-list">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="leaderboard-mobile-card">
                  <div className="skeleton" style={{ height: 22, width: 120, borderRadius: 6, marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 16, width: '100%', borderRadius: 6, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 16, width: '82%', borderRadius: 6, marginBottom: 14 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="skeleton" style={{ height: 44, borderRadius: 10 }} />
                    ))}
                  </div>
                </div>
              ))
            ) : error ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--error)' }}>Could not load leaderboard. Please check if the server is running.</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No locations set up yet. The leaderboard will appear once locations are added.</div>
            ) : leaderboard.map((loc, i) => (
              <div key={i} className="leaderboard-mobile-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: i < 3 ? `${medalColors[i]}20` : 'var(--bg-elevated)',
                        border: `2px solid ${i < 3 ? medalColors[i] : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: i < 3 ? medalColors[i] : 'var(--text-muted)',
                        flexShrink: 0
                      }}
                    >
                      {i < 3 ? medals[i] : i + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{loc.name}</span>
                        <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>{loc.code}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 4 }}>Chairman: {loc.chairman}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem' }}>{formatRevenue(getRevenueValue(loc))}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Revenue</div>
                  </div>
                </div>

                <div className="leaderboard-mobile-stats">
                  <div className="leaderboard-mobile-stat">
                    <div className="leaderboard-mobile-stat-label">Members</div>
                    <div className="leaderboard-mobile-stat-value">{loc.totalMembers}</div>
                  </div>
                  <div className="leaderboard-mobile-stat">
                    <div className="leaderboard-mobile-stat-label">Connections</div>
                    <div className="leaderboard-mobile-stat-value" style={{ color: 'var(--accent)' }}>{getConnectionsValue(loc)}</div>
                  </div>
                  <div className="leaderboard-mobile-stat">
                    <div className="leaderboard-mobile-stat-label">Attendance</div>
                    <div className="leaderboard-mobile-stat-value" style={{ color: loc.attendanceRate >= 80 ? 'var(--success)' : loc.attendanceRate >= 60 ? 'var(--warning)' : 'var(--error)' }}>{loc.attendanceRate}%</div>
                  </div>
                  <div className="leaderboard-mobile-stat">
                    <div className="leaderboard-mobile-stat-label">Rank</div>
                    <div className="leaderboard-mobile-stat-value">#{i + 1}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="jcom-table-wrap">
            <table className="jcom-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Location</th>
                  <th>Chairman</th>
                  <th style={{ textAlign: 'right' }}>Members</th>
                  <th style={{ textAlign: 'right' }}>Connections</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th style={{ textAlign: 'right' }}>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <td key={j}>
                          <div className="skeleton" style={{ height: 18, borderRadius: 4 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--error)' }}>
                      Could not load leaderboard. Please check if the server is running.
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No locations set up yet. The leaderboard will appear once locations are added.
                    </td>
                  </tr>
                ) : leaderboard.map((loc, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: i < 3 ? `${medalColors[i]}20` : 'var(--bg-elevated)',
                            border: `2px solid ${i < 3 ? medalColors[i] : 'var(--border)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: i < 3 ? medalColors[i] : 'var(--text-muted)'
                          }}
                        >
                          {i < 3 ? medals[i] : i + 1}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loc.name}</span>{' '}
                      <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>{loc.code}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{loc.chairman}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{loc.totalMembers}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>{getConnectionsValue(loc)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatRevenue(getRevenueValue(loc))}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 60, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${loc.attendanceRate}%`,
                              background: loc.attendanceRate >= 80 ? 'var(--success)' : loc.attendanceRate >= 60 ? 'var(--warning)' : 'var(--error)',
                              borderRadius: 3
                            }}
                          />
                        </div>
                        <span style={{ color: loc.attendanceRate >= 80 ? 'var(--success)' : loc.attendanceRate >= 60 ? 'var(--warning)' : 'var(--error)', fontWeight: 700, fontSize: '0.85rem' }}>
                          {loc.attendanceRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default LeaderboardPage;
