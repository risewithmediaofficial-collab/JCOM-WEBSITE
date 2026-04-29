import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import { TrophyOutlined } from '@ant-design/icons';

const API = 'http://localhost:5000/api';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('revenue');
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState(false);

  useEffect(() => { fetchLeaderboard(); }, [sortBy, period]);

  const fetchLeaderboard = async () => {
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
  };

  const formatRevenue = (v) => {
    if (v >= 10000000) return `₹${(v/10000000).toFixed(1)} Cr`;
    if (v >= 100000) return `₹${(v/100000).toFixed(1)} L`;
    return `₹${(v||0).toLocaleString('en-IN')}`;
  };

  const medals = ['🥇', '🥈', '🥉'];
  const medalColors = ['#f5a623', '#94a3b8', '#b45309'];

  return (
    <SidebarLayout>
      <div style={{ padding: 'clamp(16px, 3vw, 32px) clamp(12px, 3vw, 28px) 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="badge badge-gold mb-md" style={{ margin: '0 auto 12px' }}>🏆 Rankings</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Location Leaderboard</h2>
          <p>Which locations are generating the most business connections? Updated automatically.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', padding: 4, borderRadius: 30, border: '1px solid var(--border)' }}>
            {[
              { key: 'revenue', label: '💰 Revenue' },
              { key: 'connections', label: '🔗 Connections' },
              { key: 'members', label: '👥 Members' },
              { key: 'attendance', label: '📅 Attendance' },
            ].map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)} className={`btn btn-sm ${sortBy === s.key ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 24 }}>
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', padding: 4, borderRadius: 30, border: '1px solid var(--border)' }}>
            {['weekly', 'monthly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`btn btn-sm ${period === p ? 'btn-teal' : 'btn-ghost'}`} style={{ borderRadius: 24 }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 3 && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap' }}>
            {/* 2nd */}
            <div className="glass-card" style={{ width: 240, textAlign: 'center', padding: 24, borderColor: 'rgba(148,163,184,0.4)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🥈</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{leaderboard[1].name}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Chairman: {leaderboard[1].chairman}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8' }}>{formatRevenue(leaderboard[1].totalRevenue)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Revenue</div>
            </div>
            {/* 1st */}
            <div className="glass-card-gold" style={{ width: 280, textAlign: 'center', padding: 28, transform: 'scale(1.05)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>🥇</div>
              <div className="badge badge-gold mb-md" style={{ margin: '0 auto 8px' }}>TOP LOCATION</div>
              <h3 style={{ color: 'var(--primary)', marginBottom: 4 }}>{leaderboard[0].name}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Chairman: {leaderboard[0].chairman}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{formatRevenue(leaderboard[0].totalRevenue)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Revenue Generated</div>
              <div className="grid-2" style={{ marginTop: 16, gap: 10 }}>
                <div><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{leaderboard[0].totalConnections}</div><div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Connections</div></div>
                <div><div style={{ fontWeight: 700, color: 'var(--accent)' }}>{leaderboard[0].attendanceRate}%</div><div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Attendance</div></div>
              </div>
            </div>
            {/* 3rd */}
            <div className="glass-card" style={{ width: 240, textAlign: 'center', padding: 24, borderColor: 'rgba(180,83,9,0.4)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🥉</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{leaderboard[2].name}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Chairman: {leaderboard[2].chairman}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#b45309' }}>{formatRevenue(leaderboard[2].totalRevenue)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Revenue</div>
            </div>
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="glass-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Full Rankings — {period === 'weekly' ? 'This Week' : 'This Month'}</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
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
                  [1,2,3].map(i => (
                    <tr key={i}>
                      {[1,2,3,4,5,6,7].map(j => <td key={j}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td>)}
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--error)' }}>⚠️ Could not load leaderboard. Please check if the server is running.</td></tr>
                ) : leaderboard.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>🏆 No locations set up yet. The leaderboard will appear once locations are added.</td></tr>
                ) : leaderboard.map((loc, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? `${medalColors[i]}20` : 'var(--bg-elevated)', border: `2px solid ${i < 3 ? medalColors[i] : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: i < 3 ? medalColors[i] : 'var(--text-muted)' }}>
                          {i < 3 ? medals[i] : i + 1}
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loc.name}</span> <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>{loc.code}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{loc.chairman}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{loc.totalMembers}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>{loc.totalConnections}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatRevenue(loc.totalRevenue)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', align: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 60, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${loc.attendanceRate}%`, background: loc.attendanceRate >= 80 ? 'var(--success)' : loc.attendanceRate >= 60 ? 'var(--warning)' : 'var(--error)', borderRadius: 3 }} />
                        </div>
                        <span style={{ color: loc.attendanceRate >= 80 ? 'var(--success)' : loc.attendanceRate >= 60 ? 'var(--warning)' : 'var(--error)', fontWeight: 700, fontSize: '0.85rem' }}>{loc.attendanceRate}%</span>
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
