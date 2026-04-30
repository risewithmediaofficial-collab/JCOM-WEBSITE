import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SearchOutlined, ArrowRightOutlined, TeamOutlined, TrophyOutlined, LinkOutlined, RiseOutlined, EnvironmentOutlined, StarOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const HomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ globalStats: { totalMembers: 0, totalConnections: 0, totalRevenue: 0 }, locations: [] });
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState({ members: 0, connections: 0, revenue: 0 });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setStatsError(false);
    try {
      const [statsRes, lbRes] = await Promise.all([
        axios.get(`${API}/stats/home?period=${period}`),
        axios.get(`${API}/stats/leaderboard?period=${period}&by=revenue`)
      ]);
      setStats(statsRes.data);
      setLeaderboard(lbRes.data.leaderboard || []);
      animateCounters(statsRes.data.globalStats);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setStatsError(true);
      // Show real zeros — no fake numbers
      setStats({ globalStats: { totalMembers: 0, totalConnections: 0, totalRevenue: 0 }, locations: [] });
      setCounters({ members: 0, connections: 0, revenue: 0 });
    }
    setLoading(false);
  };

  const animateCounters = (gs) => {
    if (!gs) return;
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const targets = {
      members:     gs.totalMembers     || 0,
      connections: gs.totalConnections || 0,
      revenue:     gs.totalRevenue     || 0
    };
    // Reset first
    setCounters({ members: 0, connections: 0, revenue: 0 });
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setCounters({
        members:     Math.floor(targets.members     * ease),
        connections: Math.floor(targets.connections * ease),
        revenue:     Math.floor(targets.revenue     * ease)
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim().length >= 2) navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const formatRevenue = (r) => {
    if (r >= 10000000) return `₹${(r/10000000).toFixed(1)} Cr`;
    if (r >= 100000) return `₹${(r/100000).toFixed(1)} L`;
    return `₹${r.toLocaleString('en-IN')}`;
  };

  const features = [
    { icon: '🤝', title: 'Smart Networking', desc: 'Connect with verified entrepreneurs across locations. Every connection is a potential business opportunity.' },
    { icon: '📊', title: 'Live CRM Dashboard', desc: 'Track every lead, follow-up, and deal with our professional CRM built for JCOM members.' },
    { icon: '💰', title: 'Revenue Tracking', desc: 'Real-time revenue tracking per member, table, location — from connection to confirmed deal.' },
    { icon: '📅', title: '4 Meetings Monthly', desc: 'Growth, Problem-Solving, Solutions & C2C networking meetings structured for maximum engagement.' },
    { icon: '🏆', title: 'Leaderboard', desc: 'Healthy competition drives growth. See which locations are generating the most business connections.' },
    { icon: '🔍', title: 'JustDial-style Search', desc: 'Search by keywords, business category, location — find the right business partner instantly.' },
  ];

  const weekTypes = [
    { week: 'Week 1', type: 'Growth', icon: '📈', desc: 'Share wins, set growth targets for the month' },
    { week: 'Week 2', type: 'Problems', icon: '🧩', desc: 'Identify challenges, seek collective wisdom' },
    { week: 'Week 3', type: 'Solutions', icon: '💡', desc: 'Implement solutions, share successes' },
    { week: 'Week 4', type: 'C2C Networking', icon: '🌐', desc: 'Cross-location business connecting' },
  ];

  const featuredLocation = leaderboard[0];
  const runnerUpLocations = leaderboard.slice(1, 3);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(0,73,194,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 50%, rgba(0,184,148,0.06) 0%, transparent 55%), linear-gradient(135deg, #f0f5ff 0%, #eef2ff 60%, #f0fdf9 100%)',
        padding: '80px 16px 40px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Floating orbs */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.06), transparent)', top: '10%', left: '-5%', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.06), transparent)', bottom: '10%', right: '5%', animation: 'float 6s ease-in-out infinite reverse' }} />

        <div style={{ maxWidth: 900, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="badge badge-gold mb-md animate-fadeInUp" style={{ margin: '0 auto 20px' }}>
            ⚡ India's Premier Business Networking Platform
          </div>
          <h1 className="animate-fadeInUp delay-1" style={{ marginBottom: 20 }}>
            <span style={{ color: 'var(--text-primary)' }}>Connect. Collaborate.</span>
            <br />
            <span className="highlight-gold">Grow Together.</span>
          </h1>
          <p className="animate-fadeInUp delay-2" style={{ fontSize: '1.15rem', maxWidth: 660, margin: '0 auto 32px', color: 'var(--text-secondary)' }}>
            JCOM connects verified business professionals across India. Build meaningful connections, track deals, and grow your revenue with our structured networking system.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="animate-fadeInUp delay-3 hero-search">
            <SearchOutlined className="hero-search-icon" style={{ padding: '0 16px', color: 'var(--primary)', fontSize: '1.1rem' }} />
            <input
              type="text" placeholder="Search by business, category, keyword, location..."
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', padding: '14px 0' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 50, margin: 6, padding: '10px 24px' }}>
              Search
            </button>
          </form>

          <div className="animate-fadeInUp delay-4" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Register Your Business <ArrowRightOutlined />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Member Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS ── */}
      {featuredLocation && (
        <section style={{ padding: '32px 16px 80px', background: 'linear-gradient(180deg, #f0f5ff 0%, #f8f9fc 100%)' }}>
          <div className="section-shell">
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="badge badge-gold mb-md" style={{ margin: '0 auto 12px' }}>Top Locations</div>
              <h2 style={{ marginBottom: 10 }}>Highest Business <span className="highlight-gold">Generators</span></h2>
              <p style={{ maxWidth: 720, margin: '0 auto' }}>
                Visitors can instantly see which JCOM chapters are creating the strongest business momentum.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: runnerUpLocations.length > 0 ? 'minmax(0, 620px) minmax(280px, 340px)' : 'minmax(0, 720px)',
                justifyContent: 'center',
                alignItems: 'stretch',
                gap: 18,
                marginBottom: 18
              }}
            >
              <div className="glass-card-gold" style={{ position: 'relative', padding: '24px clamp(18px, 3vw, 30px)', maxWidth: 720, width: '100%', margin: '0 auto' }}>
                <div style={{ position: 'absolute', top: 18, right: 18, fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>1</div>
                <div className="badge badge-gold" style={{ marginBottom: 14 }}>Top Performing Chapter</div>
                <h2 style={{ color: 'var(--primary)', marginBottom: 6, fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>{featuredLocation.name}</h2>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 22 }}>
                  Chairman: {featuredLocation.chairman}
                </div>

                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="glass-card" style={{ padding: 16, textAlign: 'center', background: 'rgba(255,255,255,0.82)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.55rem', color: 'var(--text-primary)' }}>{featuredLocation.totalConnections}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Connects</div>
                  </div>
                  <div className="glass-card" style={{ padding: 16, textAlign: 'center', background: 'rgba(255,255,255,0.82)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.55rem', color: 'var(--primary)' }}>{formatRevenue(featuredLocation.totalRevenue)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue</div>
                  </div>
                  <div className="glass-card" style={{ padding: 16, textAlign: 'center', background: 'rgba(255,255,255,0.82)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.55rem', color: 'var(--accent)' }}>{featuredLocation.totalMembers}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Members</div>
                  </div>
                  <div className="glass-card" style={{ padding: 16, textAlign: 'center', background: 'rgba(255,255,255,0.82)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.55rem', color: '#7c3aed' }}>{featuredLocation.attendanceRate}%</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance</div>
                  </div>
                </div>
              </div>

              {runnerUpLocations.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 340 }}>
                {runnerUpLocations.map((loc, index) => (
                  <div key={loc.name} className="glass-card" style={{ position: 'relative', padding: 24 }}>
                    <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {index + 2}
                    </div>
                    <h3 style={{ color: 'var(--primary)', marginBottom: 6 }}>{loc.name}</h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                      Chairman: {loc.chairman}
                    </div>
                    <div className="grid-2" style={{ gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem' }}>{loc.totalConnections}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Connects</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>{formatRevenue(loc.totalRevenue)}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.2rem' }}>{loc.totalMembers}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Members</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '1.2rem' }}>{loc.attendanceRate}%</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance</div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section style={{ padding: '80px 16px', background: 'var(--bg-surface)' }}>
        <div className="section-shell">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statsError ? '#dc2626' : '#16a34a', display: 'inline-block', boxShadow: statsError ? 'none' : '0 0 6px #16a34a', animation: statsError ? 'none' : 'pulse-glow 2s infinite' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: statsError ? '#dc2626' : '#16a34a' }}>
                {statsError ? 'Server Unreachable' : 'Live Data'}
              </span>
            </div>
            <div className="badge badge-teal mb-md" style={{ margin: '0 auto 12px' }}>📊 Platform Statistics</div>
            <h2>Platform Performance</h2>
            {/* Period Toggle */}
            <div className="responsive-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
              {['weekly', 'monthly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 48 }}>
            {[
              { icon: '👥', label: 'Total Members', value: counters.members, color: 'var(--primary)' },
              { icon: '🔗', label: `${period === 'weekly' ? 'Weekly' : 'Monthly'} Connections`, value: counters.connections, color: 'var(--accent)' },
              { icon: '💰', label: `${period === 'weekly' ? 'Weekly' : 'Monthly'} Revenue`, value: formatRevenue(counters.revenue), color: '#7c3aed', isFormatted: true },
            ].map((s, i) => (
              <div key={i} className="stat-card animate-fadeInUp" style={{ animationDelay: `${i * 0.15}s`, textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{s.icon}</div>
                {loading ? (
                  <div className="skeleton" style={{ height: 48, width: 120, margin: '0 auto 8px', borderRadius: 8 }} />
                ) : (
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2.2rem', fontWeight: 800, color: s.color }}>
                    {s.isFormatted ? s.value : s.value.toLocaleString('en-IN')}
                  </div>
                )}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Location Table */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>📍 Location-wise Performance</h3>
              {statsError && (
                <span style={{ fontSize: '0.8rem', color: 'var(--error)', background: 'rgba(220,38,38,0.08)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(220,38,38,0.2)' }}>
                  ⚠️ Could not reach server
                </span>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="jcom-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Members</th>
                    <th>Connections</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1,2,3].map(i => (
                      <tr key={i}>
                        {[1,2,3,4].map(j => <td key={j}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td>)}
                      </tr>
                    ))
                  ) : stats.locations.length > 0 ? stats.locations.map((loc, i) => (
                    <tr key={i}>
                      <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loc.name}</span></td>
                      <td><span className="badge badge-teal">{loc.members}</span></td>
                      <td>{loc.connections}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatRevenue(loc.revenue)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        {statsError ? '⚠️ Server not reachable. Please try again later.' : '📍 No locations have been set up yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT IS JCOM ── */}
      <section style={{ padding: '80px 16px' }}>
        <div className="section-shell">
          <div className="responsive-two-col" style={{ gap: 'clamp(24px, 5vw, 64px)', alignItems: 'center' }}>
            <div>
              <div className="badge badge-gold mb-md">About JCOM</div>
              <h2 style={{ marginBottom: 20 }}>What is <span className="highlight-gold">JCOM?</span></h2>
              <p style={{ fontSize: '1.05rem', marginBottom: 20 }}>
                JCOM (Joint Chamber of Members) is India's most structured B2B networking platform. We connect verified business professionals across multiple cities through local chapters (tables) managed by elected chairmen.
              </p>
              <p style={{ marginBottom: 24 }}>
                Each member belongs to a specific location and table with a maximum of 60 members — all from different business categories, ensuring zero competition and maximum collaboration.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['✅ Verified members from 60+ business categories', '✅ Structured monthly meetings (4 per month)', '✅ Real-time CRM to track every business connection', '✅ Live revenue tracking from connection to deal'].map((t, i) => (
                  <div key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t}</div>
                ))}
              </div>
            </div>
            <div className="responsive-two-col" style={{ gap: 16 }}>
              {features.slice(0, 4).map((f, i) => (
                <div key={i} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>{f.icon}</div>
                  <h4 style={{ marginBottom: 8, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{f.title}</h4>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 16px', background: 'var(--bg-surface)' }}>
        <div className="section-shell">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="badge badge-purple mb-md" style={{ margin: '0 auto 12px' }}>🚀 Features</div>
            <h2>Everything You Need to <span className="highlight-teal">Grow</span></h2>
          </div>
          <div className="grid-3">
            {features.map((f, i) => (
              <div key={i} className="glass-card animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 16 }}>{f.icon}</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>{f.title}</h4>
                <p style={{ fontSize: '0.88rem', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEETING TYPES ── */}
      <section style={{ padding: '80px 16px' }}>
        <div className="section-shell">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="badge badge-teal mb-md" style={{ margin: '0 auto 12px' }}>📅 4 Meetings / Month</div>
            <h2>Structured for <span className="highlight-gold">Maximum Growth</span></h2>
          </div>
          <div className="grid-4">
            {weekTypes.map((w, i) => (
              <div key={i} className="glass-card-gold animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s`, textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{w.icon}</div>
                <div className="badge badge-gold mb-md" style={{ margin: '0 auto 8px' }}>{w.week}</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{w.type}</h4>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEADERBOARD ── */}
      {false && leaderboard.length > 0 && (
        <section style={{ padding: '80px 16px', background: '#f1f4f9' }}>
          <div className="section-shell">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="badge badge-gold mb-md" style={{ margin: '0 auto 12px' }}>🏆 Top Locations</div>
              <h2>Highest Business <span className="highlight-gold">Generators</span></h2>
            </div>
            <div className="grid-3">
              {leaderboard.slice(0, 3).map((loc, i) => (
                <div key={i} className="glass-card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 12, right: 12, fontSize: '2rem' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <h3 style={{ color: 'var(--primary)', marginBottom: 4 }}>{loc.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>Chairman: {loc.chairman}</div>
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div><div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{loc.totalConnections}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Connects</div></div>
                    <div><div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)' }}>{formatRevenue(loc.totalRevenue)}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue</div></div>
                    <div><div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent)' }}>{loc.totalMembers}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Members</div></div>
                    <div><div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#7c3aed' }}>{loc.attendanceRate}%</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section style={{
        padding: '100px 16px', textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(230,146,10,0.08) 0%, transparent 70%)'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 16 }}>Ready to <span className="highlight-gold">Connect?</span></h2>
          <p style={{ marginBottom: 32, fontSize: '1.05rem' }}>Join thousands of verified business professionals across India building real connections and generating real revenue.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg animate-pulse-glow">Register Now — It's Free</Link>
            <Link to="/search" className="btn btn-outline btn-lg">Browse Members</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#f1f4f9', borderTop: '1px solid rgba(0,0,0,0.08)', padding: '40px 16px' }}>
        <div className="section-shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.3rem', background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>JCOM</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Connecting Businesses | Generating Opportunities | Tracking Growth</div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Login</Link>
            <Link to="/register" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Register</Link>
            <Link to="/search" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Search</Link>
            <Link to="/leaderboard" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leaderboard</Link>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>© 2026 JCOM. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

