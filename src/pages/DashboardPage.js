import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const EMPTY_STATS = {
  given: 0,
  received: 0,
  total: 0,
  revenue: 0,
  completedDeals: 0,
  meetingsAttended: 0,
  totalMeetings: 0,
  publicEnquiries: 0,
  recentPublicEnquiries: [],
  overallTotals: {
    givenRequests: 0,
    receivedRequests: 0,
    totalConnections: 0,
    totalRevenue: 0,
    meetingsAttended: 0
  }
};

const EMPTY_CONNECTION_STATS = {
  given: 0,
  received: 0,
  total: 0,
  connected: 0
};

const EMPTY_DEAL_STATS = {
  completedDeals: 0,
  totalRevenue: 0
};

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [dealStats, setDealStats] = useState(EMPTY_DEAL_STATS);
  const [connStats, setConnStats] = useState(EMPTY_CONNECTION_STATS);
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [memberStatsRes, dealStatsRes, connStatsRes, lbRes] = await Promise.allSettled([
        axios.get(`${API}/stats/member?period=${period}`, { headers }),
        axios.get(`${API}/deals/stats?period=${period}`, { headers }),
        axios.get(`${API}/connections/stats?period=${period}`, { headers }),
        axios.get(`${API}/stats/leaderboard?period=${period}&by=revenue`)
      ]);

      setStats(memberStatsRes.status === 'fulfilled' ? memberStatsRes.value.data : EMPTY_STATS);
      setDealStats(dealStatsRes.status === 'fulfilled' ? dealStatsRes.value.data : EMPTY_DEAL_STATS);
      setConnStats(connStatsRes.status === 'fulfilled' ? connStatsRes.value.data : EMPTY_CONNECTION_STATS);
      setLeaderboard(
        lbRes.status === 'fulfilled'
          ? (lbRes.value.data.leaderboard?.slice(0, 5) || [])
          : []
      );
    } catch (err) {
      console.error('Dashboard stats fetch failed:', err);
      setStats(EMPTY_STATS);
      setConnStats(EMPTY_CONNECTION_STATS);
      setDealStats(EMPTY_DEAL_STATS);
      setLeaderboard([]);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `Rs.${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `Rs.${(value / 100000).toFixed(1)} L`;
    return `Rs.${(value || 0).toLocaleString('en-IN')}`;
  };

  return (
    <SidebarLayout>
      <div className="stack-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Welcome back</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{user?.firstName} {user?.lastName}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-gold">{user?.membershipId}</span>
            <span className="badge badge-teal">{user?.locationName} · {user?.tableName}</span>
            {user?.subRole && <span className="badge badge-info">{user?.subRole}</span>}
          </div>
        </div>

        <div className="filter-pills-group" style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', padding: 4, borderRadius: 30, border: '1px solid var(--border)' }}>
          {['weekly', 'monthly', 'yearly'].map((item) => (
            <button key={item} onClick={() => setPeriod(item)} className={`btn btn-sm ${period === item ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 24 }}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: 16 }}>My Table</h4>
      </div>

      <div className="glass-card mb-lg" style={{ marginBottom: 24 }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>
          Requests Summary - <span style={{ color: 'var(--primary)' }}>{period.charAt(0).toUpperCase() + period.slice(1)}</span>
        </h4>
        <div className="jcom-table-wrap">
          <table className="jcom-table">
            <thead>
              <tr>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Request Given</th>
                <th style={{ textAlign: 'right' }}>Request Received</th>
                <th style={{ textAlign: 'right' }}>Given + Received</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Connections ({period})</td>
                <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>{connStats?.given || 0}</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>{connStats?.received || 0}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>{connStats?.total || 0}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>All Time Totals</td>
                <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>{stats?.overallTotals?.givenRequests || 0}</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>{stats?.overallTotals?.receivedRequests || 0}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {(stats?.overallTotals?.givenRequests || 0) + (stats?.overallTotals?.receivedRequests || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card mb-lg" style={{ marginBottom: 24 }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>
          Revenue Summary - <span style={{ color: 'var(--primary)' }}>{period.charAt(0).toUpperCase() + period.slice(1)}</span>
        </h4>
        <div className="jcom-table-wrap">
          <table className="jcom-table">
            <thead>
              <tr>
                <th>Period</th>
                <th style={{ textAlign: 'right' }}>Deals Completed</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{period.charAt(0).toUpperCase() + period.slice(1)}</td>
                <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>{dealStats?.completedDeals || 0}</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(dealStats?.totalRevenue || 0)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>All Time</td>
                <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>-</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(stats?.overallTotals?.totalRevenue || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 32 }}>
        <StatCard label="Connections Given" value={stats?.given || 0} icon="↑" color="teal" />
        <StatCard label="Connections Received" value={stats?.received || 0} icon="↓" color="gold" />
        <StatCard label="Revenue" value={formatCurrency(stats?.revenue || 0)} icon="₹" color="purple" />
        <StatCard label="Meeting Attendance" value={`${stats?.meetingsAttended || 0}/${stats?.totalMeetings || 0}`} icon="✓" color="gold" />
      </div>

      {stats?.publicEnquiries > 0 && (
        <div className="glass-card mb-lg" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Public Enquiries</h4>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Search visitors who sent their requirement to your business.
              </div>
            </div>
            <span className="badge badge-teal">{stats.publicEnquiries} enquiries</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(stats.recentPublicEnquiries || []).map((entry) => (
              <div key={entry._id} style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: '#fbfcff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.manualContact?.name || 'Visitor enquiry'}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {entry.manualContact?.phone || 'No phone'}
                      {entry.manualContact?.location ? ` · ${entry.manualContact.location}` : ''}
                      {entry.manualContact?.email ? ` · ${entry.manualContact.email}` : ''}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                      Requirement: {entry.manualContact?.requirement || 'Not provided'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="badge badge-info">{entry.status}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      {new Date(entry.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-1" style={{ gap: 24 }}>
        <div className="glass-card">
          <div className="stack-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 10 }}>
            <h4 style={{ color: 'var(--text-primary)' }}>Top Locations</h4>
            <Link to="/leaderboard" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>See All</Link>
          </div>
          {leaderboard.length > 0 ? leaderboard.map((loc, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: index < leaderboard.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: index === 0 ? 'var(--grad-gold)' : index === 1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' : 'linear-gradient(135deg,#b45309,#92400e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: index === 0 ? '#000' : '#fff' }}>
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{loc.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loc.totalConnections} connections</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(loc.totalRevenue)}</div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.85rem' }}>
              Leaderboard updates as deals are completed
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default DashboardPage;

