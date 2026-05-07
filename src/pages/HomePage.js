import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;
const emptyStats = { globalStats: { totalMembers: 0, totalConnections: 0, totalRevenue: 0 }, locations: [], topRatedBusinesses: [] };

const cleanCardStyle = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,248,255,0.98) 100%)',
  border: '1px solid rgba(15,75,207,0.12)',
  borderRadius: 28,
  boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
  overflow: 'hidden',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease'
};

const BUSINESS_CATEGORIES = [
  'Accounting & Finance', 'Architecture & Design', 'Automobile', 'Banking & Insurance',
  'Construction & Real Estate', 'Digital Marketing', 'Education & Training', 'Engineering',
  'Fashion & Apparel', 'Food & Beverage', 'Healthcare & Medical', 'Hospitality & Tourism',
  'HR & Recruitment', 'IT & Software', 'Jewelry & Accessories', 'Legal Services',
  'Logistics & Transport', 'Manufacturing', 'Media & Entertainment', 'Printing & Publishing',
  'Retail & E-commerce', 'Security Services', 'Solar & Energy', 'Textiles', 'Travel & Tourism',
  'Wellness & Fitness', 'Other'
];

const chartPalette = ['#0f4bcf', '#16a34a', '#7c3aed', '#f59e0b', '#06b6d4'];

const AutoFitHeading = ({
  text,
  maxFontSize,
  minFontSize,
  reservedWidth,
  style = {}
}) => {
  const headingRef = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const element = headingRef.current;
    if (!element) return undefined;

    const fitText = () => {
      const parentWidth = element.parentElement?.clientWidth || element.clientWidth || 0;
      const availableWidth = Math.max(parentWidth - reservedWidth, minFontSize * 3);

      let nextSize = maxFontSize;
      element.style.fontSize = `${nextSize}px`;

      while (nextSize > minFontSize && element.scrollWidth > availableWidth) {
        nextSize -= 1;
        element.style.fontSize = `${nextSize}px`;
      }

      setFontSize(nextSize);
    };

    fitText();

    const resizeObserver = new ResizeObserver(() => {
      fitText();
    });

    if (element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }

    window.addEventListener('resize', fitText);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', fitText);
    };
  }, [maxFontSize, minFontSize, reservedWidth, text]);

  return (
    <h3
      ref={headingRef}
      style={{
        ...style,
        fontSize,
        whiteSpace: 'nowrap',
        overflow: 'visible'
      }}
    >
      {text}
    </h3>
  );
};

const AnalyticsBarChart = ({ data, valueKey, color }) => {
  const chartData = data.slice(0, 5);
  const maxValue = Math.max(...chartData.map((item) => Number(item[valueKey]) || 0), 1);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {chartData.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const width = `${Math.max((value / maxValue) * 100, 8)}%`;
        return (
          <div key={`${item.name}-${valueKey}`} style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 10, background: 'rgba(15,75,207,0.08)', color: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                  {index + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Connections
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {value.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ height: 14, borderRadius: 999, background: 'linear-gradient(90deg, #edf2ff 0%, #f8fbff 100%)', overflow: 'hidden', border: '1px solid rgba(15,75,207,0.08)' }}>
              <div style={{ height: '100%', width, borderRadius: 999, background: `linear-gradient(90deg, ${color} 0%, #4f8df7 100%)` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AnalyticsDonutChart = ({ data, valueKey, labelFormatter = (value) => value.toLocaleString('en-IN') }) => {
  const chartData = data.slice(0, 4);
  const total = chartData.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="responsive-main-aside" style={{ alignItems: 'center', gap: 28 }}>
      <svg width="190" height="190" viewBox="0 0 190 190" role="img" aria-label="Distribution chart">
        <defs>
          <filter id="donutGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform="translate(95 95) rotate(-90)">
          <circle r={radius} fill="none" stroke="#eef2ff" strokeWidth="18" />
          {chartData.map((item, index) => {
            const value = Number(item[valueKey]) || 0;
            const segment = total > 0 ? (value / total) * circumference : 0;
            const circle = (
              <circle
                key={`${item.name}-${valueKey}`}
                r={radius}
                fill="none"
                stroke={chartPalette[index % chartPalette.length]}
                strokeWidth="18"
                strokeDasharray={`${segment} ${circumference - segment}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                filter="url(#donutGlow)"
              />
            );
            offset += segment;
            return circle;
          })}
        </g>
        <circle cx="95" cy="95" r="39" fill="#ffffff" />
        <text x="50%" y="45%" textAnchor="middle" style={{ fontSize: '0.72rem', fill: '#6b7280', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Total
        </text>
        <text x="50%" y="57%" textAnchor="middle" style={{ fontSize: '1.1rem', fill: '#111827', fontWeight: 900 }}>
          {labelFormatter(total)}
        </text>
      </svg>

      <div style={{ flex: 1, display: 'grid', gap: 12 }}>
        {chartData.map((item, index) => (
          <div key={`${item.name}-legend-${valueKey}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 16, background: '#f8fbff', border: '1px solid rgba(15,75,207,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: chartPalette[index % chartPalette.length], flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Contribution
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 900 }}>
              {labelFormatter(Number(item[valueKey]) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const heroSectionRef = useRef(null);
  const heroContentRef = useRef(null);
  const [overallStats, setOverallStats] = useState(emptyStats);
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [searchQ, setSearchQ] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchTable, setSearchTable] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchLocations, setSearchLocations] = useState([]);
  const [searchTables, setSearchTables] = useState([]);
  const [searchCategories, setSearchCategories] = useState([]);
  const [platformError, setPlatformError] = useState(false);
  const [overallError, setOverallError] = useState(false);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [overallLoading, setOverallLoading] = useState(true);
  const [counters, setCounters] = useState({ members: 0, connections: 0, revenue: 0 });
  const topRatedCount = (overallStats.topRatedBusinesses || []).length;

  const fetchPeriodData = useCallback(async () => {
    setPlatformLoading(true);
    setPlatformError(false);
    try {
      const statsRes = await axios.get(`${API}/stats/home?period=${period}`);
      animateCounters(statsRes.data.globalStats);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setPlatformError(true);
      // Show real zeros — no fake numbers
      setCounters({ members: 0, connections: 0, revenue: 0 });
    }
    setPlatformLoading(false);
  }, [period]);

  useEffect(() => {
    fetchPeriodData();
  }, [fetchPeriodData]);

  useEffect(() => {
    const fetchOverallStats = async () => {
      setOverallLoading(true);
      setOverallError(false);
      try {
        const statsRes = await axios.get(`${API}/stats/home?period=overall`);
        setOverallStats(statsRes.data);
      } catch (err) {
        console.error('Overall stats fetch error:', err);
        setOverallError(true);
        setOverallStats(emptyStats);
      }
      setOverallLoading(false);
    };

    fetchOverallStats();
  }, []);

  useEffect(() => {
    const fetchOverallLeaderboard = async () => {
      try {
        const lbRes = await axios.get(`${API}/stats/leaderboard?period=overall&by=revenue`);
        setLeaderboard(lbRes.data.leaderboard || []);
      } catch (err) {
        console.error('Overall leaderboard fetch error:', err);
        setLeaderboard([]);
      }
    };

    fetchOverallLeaderboard();
  }, []);

  useEffect(() => {
    const fetchSearchLocations = async () => {
      try {
        const res = await axios.get(`${API}/admin/locations`);
        setSearchLocations(res.data.locations || []);
      } catch (err) {
        setSearchLocations([]);
      }
    };
    fetchSearchLocations();
  }, []);

  useEffect(() => {
    const fetchSearchFilters = async () => {
      try {
        const params = new URLSearchParams();
        if (searchLocation) params.set('location', searchLocation);
        if (searchTable) params.set('table', searchTable);
        const queryString = params.toString();
        const res = await axios.get(`${API}/users/search-filters${queryString ? `?${queryString}` : ''}`);
        setSearchCategories(res.data.categories || []);
        if (!searchLocation) {
          setSearchTables(res.data.tables || []);
        }
      } catch (err) {
        setSearchCategories([]);
        if (!searchLocation) setSearchTables([]);
      }
    };
    fetchSearchFilters();
  }, [searchLocation, searchTable]);

  useEffect(() => {
    const selectedLocation = searchLocations.find((location) => location.name === searchLocation);
    if (!selectedLocation) {
      setSearchTable('');
      return;
    }

    const fetchTables = async () => {
      try {
        const res = await axios.get(`${API}/admin/tables/${selectedLocation._id}`);
        const tables = (res.data.tables || []).map((table) => table.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
        setSearchTables(tables);
        setSearchTable((current) => (current && tables.includes(current) ? current : ''));
      } catch (err) {
        setSearchTables([]);
        setSearchTable('');
      }
    };

    fetchTables();
  }, [searchLocation, searchLocations]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (heroContentRef.current) {
        gsap.fromTo(
          heroContentRef.current.children,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.12
          }
        );
      }

      gsap.utils.toArray('.home-reveal').forEach((section) => {
        gsap.fromTo(
          section,
          { y: 56, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 82%'
            }
          }
        );
      });

      gsap.utils.toArray('.parallax-card').forEach((card, index) => {
        gsap.fromTo(
          card,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: index * 0.05,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%'
            }
          }
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, [leaderboard.length, overallStats.locations.length, topRatedCount]);

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
    const trimmedQuery = searchQ.trim();
    const trimmedTable = searchTable.trim();
    const trimmedCategory = searchCategory.trim();
    if (trimmedQuery.length >= 2 || searchLocation || trimmedTable || trimmedCategory) {
      const params = new URLSearchParams();
      if (trimmedQuery) params.set('q', trimmedQuery);
      if (searchLocation) params.set('location', searchLocation);
      if (trimmedTable) params.set('table', trimmedTable);
      if (trimmedCategory) params.set('category', trimmedCategory);
      navigate(`/search?${params.toString()}`);
    }
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

  const rankedLeaderboard = [...leaderboard].sort((a, b) => {
    if ((b.totalRevenue || 0) !== (a.totalRevenue || 0)) return (b.totalRevenue || 0) - (a.totalRevenue || 0);
    if ((b.totalConnections || 0) !== (a.totalConnections || 0)) return (b.totalConnections || 0) - (a.totalConnections || 0);
    if ((b.totalMembers || 0) !== (a.totalMembers || 0)) return (b.totalMembers || 0) - (a.totalMembers || 0);
    return (a.name || '').localeCompare(b.name || '');
  });
  const featuredLocation = rankedLeaderboard[0];
  const topThreeLocations = rankedLeaderboard.slice(0, 3);
  const topRatedBusinesses = overallStats.topRatedBusinesses || [];
  const locationOptions = (searchLocations.length > 0
    ? searchLocations.map((loc) => loc.name)
    : (overallStats.locations || []).map((loc) => loc.name)
  ).filter(Boolean).sort((a, b) => a.localeCompare(b));
  const categoryOptions = (searchCategories.length > 0 ? searchCategories : BUSINESS_CATEGORIES)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const locationPerformanceData = (overallStats.locations || [])
    .map((loc) => ({
      name: loc.name,
      members: Number(loc.members) || 0,
      connections: Number(loc.connections) || 0,
      revenue: Number(loc.revenue) || 0
    }))
    .sort((a, b) => b.revenue - a.revenue);
  const topLocationRows = (overallStats.locations || []).slice(0, 3);

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section ref={heroSectionRef} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: '96px 16px 40px', position: 'relative', overflow: 'hidden',
        marginTop: '-1px'
      }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,248,255,0.96) 58%, rgba(255,255,255,1) 100%)'
          }}
        />
        <div ref={heroContentRef} style={{ maxWidth: 900, textAlign: 'center', position: 'relative', zIndex: 1 }}>
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
          <div className="animate-fadeInUp delay-3" style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gap: 14 }}>
            <form onSubmit={handleSearch} className="hero-search">
              <SearchOutlined className="hero-search-icon" style={{ padding: '0 16px', color: 'var(--primary)', fontSize: '1.1rem' }} />
              <input
                type="text" placeholder="Search by business, keyword, or service..."
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', padding: '14px 0' }}
              />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: 50, margin: 6, padding: '10px 24px' }}>
                Search
              </button>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, width: '100%' }}>
              <select
                className="form-select"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                style={{ width: '100%', minHeight: 44, background: '#ffffff' }}
              >
                <option value="">All Locations</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <select
                className="form-select"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                style={{ width: '100%', minHeight: 44, background: '#ffffff' }}
              >
                <option value="">All Tables</option>
                {searchTables.map((table) => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
              <select
                className="form-select"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                style={{ width: '100%', minHeight: 44, background: '#ffffff' }}
              >
                <option value="">All Categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="animate-fadeInUp delay-4" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 860, margin: '18px auto 0' }}>
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
        <section className="home-reveal" style={{ padding: '32px 16px 80px', background: '#ffffff' }}>
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 22,
                alignItems: 'center',
                marginBottom: 18
              }}
            >
              {topThreeLocations.map((loc, index) => {
                const isLeader = index === 0;
                const orderMap = isLeader ? 2 : index === 1 ? 1 : 3;
                const statItems = [
                  { label: 'Connects', value: loc.totalConnections || 0, color: 'var(--text-primary)' },
                  { label: 'Revenue', value: formatRevenue(loc.totalRevenue || 0), color: 'var(--primary)' },
                  { label: 'Members', value: loc.totalMembers, color: 'var(--accent)' }
                ];

                return (
                  <div
                    key={loc.name}
                    className="parallax-card modern-showcase-card"
                    style={{
                      ...cleanCardStyle,
                      position: 'relative',
                      padding: isLeader ? '32px clamp(22px, 3vw, 38px)' : '26px 24px',
                      background: isLeader
                        ? 'linear-gradient(145deg, #ffffff 0%, #f7faff 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #fafcff 100%)',
                      minHeight: isLeader ? 420 : 360,
                      order: orderMap,
                      transform: isLeader ? 'translateY(0)' : 'translateY(36px)'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: isLeader ? 22 : 18,
                      right: isLeader ? 22 : 18,
                      width: isLeader ? 56 : 44,
                      height: isLeader ? 56 : 44,
                      borderRadius: isLeader ? 18 : 14,
                      background: 'linear-gradient(135deg, rgba(15,75,207,0.1) 0%, rgba(15,75,207,0.02) 100%)',
                      border: '1px solid rgba(15,75,207,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isLeader ? '1.35rem' : '1rem',
                      fontWeight: 900,
                      color: 'var(--primary)'
                    }}>
                      #{index + 1}
                    </div>

                    <div className="badge badge-gold" style={{ marginBottom: 18 }}>
                      {isLeader ? 'Top Performing Chapter' : 'Runner Up Chapter'}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: 12 }}>
                      {isLeader ? 'Lead Chapter' : 'High Momentum Chapter'}
                    </div>

                    <AutoFitHeading
                      text={loc.name}
                      maxFontSize={isLeader ? 58 : 40}
                      minFontSize={isLeader ? 28 : 24}
                      reservedWidth={isLeader ? 92 : 72}
                      style={{
                        color: 'var(--primary)',
                        marginBottom: 10,
                        lineHeight: 1,
                        letterSpacing: '-0.04em',
                        fontWeight: 700
                      }}
                    />

                    <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 22 }}>
                      Chairman: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loc.chairman}</span>
                    </div>

                    <div style={{
                      padding: isLeader ? '18px 20px' : '16px 18px',
                      borderRadius: 22,
                      background: isLeader ? 'linear-gradient(135deg, #0f4bcf 0%, #2d6cf5 100%)' : '#ffffff',
                      color: isLeader ? '#ffffff' : 'var(--text-primary)',
                      border: isLeader ? 'none' : '1px solid rgba(0,0,0,0.06)',
                      marginBottom: 18
                    }}>
                      <div style={{
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: isLeader ? 'rgba(255,255,255,0.72)' : 'var(--text-muted)',
                        marginBottom: 8,
                        fontWeight: 700
                      }}>
                        Chapter Revenue
                      </div>
                      <div style={{
                        fontWeight: 900,
                        fontSize: isLeader ? 'clamp(2rem, 3vw, 2.8rem)' : '1.8rem',
                        color: isLeader ? '#ffffff' : 'var(--primary)',
                        lineHeight: 1.02
                      }}>
                        {formatRevenue(loc.totalRevenue || 0)}
                      </div>
                      <div style={{
                        marginTop: 10,
                        fontSize: '0.82rem',
                        color: isLeader ? 'rgba(255,255,255,0.78)' : 'var(--text-secondary)'
                      }}>
                        {isLeader ? 'Strongest business generation in the current period' : 'Consistent chapter performance and contribution'}
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: 12
                    }}>
                      {statItems.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            padding: '16px 14px',
                            borderRadius: 18,
                            background: 'rgba(255,255,255,0.96)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            minWidth: 0
                          }}
                        >
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700 }}>
                            {item.label}
                          </div>
                          <div style={{ fontWeight: 900, fontSize: '1.2rem', color: item.color, lineHeight: 1.05 }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="home-reveal" style={{ padding: '80px 16px', background: 'var(--bg-surface)' }}>
        <div className="section-shell">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: platformError ? '#dc2626' : '#16a34a', display: 'inline-block', boxShadow: platformError ? 'none' : '0 0 6px #16a34a', animation: platformError ? 'none' : 'pulse-glow 2s infinite' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: platformError ? '#dc2626' : '#16a34a' }}>
                {platformError ? 'Server Unreachable' : 'Live Data'}
              </span>
            </div>
            <div className="badge badge-teal mb-md" style={{ margin: '0 auto 12px' }}>📊 Platform Statistics</div>
            <h2>Platform Performance</h2>
            {/* Period Toggle */}
            <div className="responsive-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
              {['weekly', 'monthly', 'yearly'].map(p => (
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
              { icon: '🔗', label: `${period === 'weekly' ? 'Weekly' : period === 'yearly' ? 'Yearly' : 'Monthly'} Connections`, value: counters.connections, color: 'var(--accent)' },
              { icon: '💰', label: `${period === 'weekly' ? 'Weekly' : period === 'yearly' ? 'Yearly' : 'Monthly'} Revenue`, value: formatRevenue(counters.revenue), color: '#7c3aed', isFormatted: true },
            ].map((s, i) => (
              <div key={i} className="modern-overview-card animate-fadeInUp" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="modern-overview-card__top">
                  <div className={`modern-overview-card__badge modern-overview-card__badge--${i === 0 ? 'gold' : i === 1 ? 'teal' : 'purple'}`}>
                    {s.icon}
                  </div>
                </div>
                <div className="modern-overview-card__body">
                  <div className="modern-overview-card__eyebrow">Platform overview</div>
                  <div className="modern-overview-card__title">{s.label}</div>
                  <div className="modern-overview-card__subtitle">
                    {period === 'weekly'
                      ? 'Fresh weekly movement from across the network.'
                      : period === 'yearly'
                        ? 'A year-to-date snapshot of JCOM activity.'
                        : 'A clean monthly snapshot of JCOM activity.'}
                  </div>
                </div>
                {platformLoading ? (
                  <div className="skeleton" style={{ height: 48, width: 120, margin: '0 auto 8px', borderRadius: 8 }} />
                ) : (
                  <div className="modern-overview-card__value" style={{ color: s.color }}>
                    {s.isFormatted ? s.value : s.value.toLocaleString('en-IN')}
                  </div>
                )}
                <div className="modern-overview-card__footer">
                  <div className="modern-overview-card__meta">
                    <span>Live indicator</span>
                    <strong>{i === 0 ? 'Members' : i === 1 ? 'Connections' : 'Revenue'}</strong>
                  </div>
                  <div className="modern-overview-card__progress" aria-hidden="true">
                    <span
                      style={{
                        width: `${i === 0 ? 74 : i === 1 ? 82 : 68}%`,
                        background: i === 0 ? 'var(--grad-gold)' : i === 1 ? 'var(--grad-teal)' : 'var(--grad-purple)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Location Table */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>📍 Location-wise Performance</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/locations-performance" className="btn btn-ghost btn-sm">
                  See All
                </Link>
                {overallError && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--error)', background: 'rgba(220,38,38,0.08)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(220,38,38,0.2)' }}>
                    ⚠️ Could not reach server
                  </span>
                )}
              </div>
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
                  {overallLoading ? (
                    [1,2,3].map(i => (
                      <tr key={i}>
                        {[1,2,3,4].map(j => <td key={j}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td>)}
                      </tr>
                    ))
                  ) : topLocationRows.length > 0 ? topLocationRows.map((loc, i) => (
                    <tr key={i}>
                      <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loc.name}</span></td>
                      <td><span className="badge badge-teal">{loc.members}</span></td>
                      <td>{Number(loc.connections || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatRevenue(Number(loc.revenue || 0))}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        {overallError ? '⚠️ Server not reachable. Please try again later.' : '📍 No locations have been set up yet.'}
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
      {locationPerformanceData.length > 0 && (
        <section className="home-reveal" style={{ padding: '24px 16px 80px', background: '#ffffff' }}>
          <div className="section-shell">
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="badge badge-gold mb-md" style={{ margin: '0 auto 12px' }}>Visual Insights</div>
              <h2 style={{ marginBottom: 10 }}>Performance <span className="highlight-gold">Analytics</span></h2>
              <p style={{ maxWidth: 760, margin: '0 auto' }}>
                A quick visual view of top-performing chapters, connection activity, and revenue contribution across the network.
              </p>
            </div>

            <div className="responsive-main-aside" style={{ alignItems: 'stretch', gap: 20 }}>
              <div className="parallax-card modern-showcase-card" style={{ ...cleanCardStyle, padding: 28, flex: 1, background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 8 }}>
                  Top Connections
                </div>
                <h3 style={{ marginBottom: 10, color: 'var(--text-primary)' }}>Chapter Connection Graph</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Compare the strongest chapters by live connection volume.
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {locationPerformanceData[0]?.connections?.toLocaleString('en-IN') || '0'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Highest Volume
                  </span>
                </div>
                <AnalyticsBarChart data={locationPerformanceData} valueKey="connections" color="#0f4bcf" />
              </div>

              <div className="parallax-card modern-showcase-card" style={{ ...cleanCardStyle, padding: 28, flex: 1, background: 'linear-gradient(180deg, #ffffff 0%, #fcfbff 100%)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 8 }}>
                  Revenue Mix
                </div>
                <h3 style={{ marginBottom: 10, color: 'var(--text-primary)' }}>Revenue Distribution</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  See how the top chapters contribute to overall business generation.
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {formatRevenue(locationPerformanceData.reduce((sum, item) => sum + item.revenue, 0))}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Total Revenue
                  </span>
                </div>
                <AnalyticsDonutChart data={locationPerformanceData} valueKey="revenue" labelFormatter={formatRevenue} />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="home-reveal" style={{ padding: '80px 16px' }}>
        <div className="section-shell">
          <div className="responsive-two-col" style={{ gap: 'clamp(24px, 5vw, 64px)', alignItems: 'start' }}>
            <div>
              <div className="badge badge-gold mb-md">About JCOM</div>
              <h2 style={{ marginBottom: 18 }}>What Is <span className="highlight-gold">JCOM?</span></h2>
              <div style={{ fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800, marginBottom: 12 }}>
                Jaycees Chamber of Commerce
              </div>
              <p style={{ fontSize: '1.03rem', marginBottom: 16 }}>
                JCOM stands for Junior Chamber Opportunities for Members. It is an initiative of JCI (Junior Chamber International) designed to provide exclusive benefits, discounts, and opportunities to JCI members.
              </p>
              <p style={{ marginBottom: 16 }}>
                Through JCOM, members can access special offers, business resources, leadership opportunities, and growth support across multiple partner categories.
              </p>
              <p style={{ marginBottom: 16 }}>
                The aim is to add value to JCI membership by helping members grow personally, professionally, and entrepreneurially while becoming stronger leaders in their communities.
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  'Education & skill development',
                  'Travel & hospitality',
                  'Health & wellness',
                  'Lifestyle & professional services',
                  'Business tools and resources'
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: '0.92rem', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22 }}>
                <Link to="/about" className="btn btn-outline">
                  Explore About JCOM
                </Link>
              </div>
            </div>
            <div className="responsive-two-col" style={{ gap: 16 }}>
              {features.slice(0, 4).map((f, i) => (
                <div key={i} className="parallax-card modern-showcase-card" style={{ ...cleanCardStyle, padding: 22 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 8 }}>
                    JCOM Advantage
                  </div>
                  <h4 style={{ marginBottom: 8, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{f.title}</h4>
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {topRatedBusinesses.length > 0 && (
        <section className="home-reveal" style={{ padding: '24px 16px 80px', background: 'var(--bg-surface)' }}>
          <div className="section-shell">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div className="badge badge-gold mb-md" style={{ margin: '0 auto 12px' }}>Top Rated Businesses</div>
              <h2 style={{ marginBottom: 10 }}>Trusted by <span className="highlight-gold">Connected Members</span></h2>
              <p style={{ maxWidth: 720, margin: '0 auto' }}>
                Real star ratings from members who have already connected and worked together.
              </p>
            </div>

            <div className="grid-3">
              {topRatedBusinesses.map((business) => (
                <Link
                  key={business._id}
                  to={business.slug ? `/${business.slug}` : `/search/${business._id}`}
                  className="parallax-card modern-showcase-card"
                  style={{ ...cleanCardStyle, padding: 22, display: 'block', textDecoration: 'none' }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 8 }}>
                    Top Rated Business
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: 6 }}>
                    {business.businessName || `${business.firstName} ${business.lastName}`}
                  </div>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>
                    {business.firstName} {business.lastName}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: 12 }}>
                    {business.businessCategory || 'Business Category'} {business.locationName ? `• ${business.locationName}` : ''}
                  </div>
                  <StarRating value={business.averageRating || 0} count={business.ratingsCount || 0} size={17} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section className="home-reveal" style={{ padding: '80px 16px', background: 'var(--bg-surface)' }}>
        <div className="section-shell">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="badge badge-purple mb-md" style={{ margin: '0 auto 12px' }}>🚀 Features</div>
            <h2>Everything You Need to <span className="highlight-teal">Grow</span></h2>
          </div>
          <div className="grid-3">
            {features.map((f, i) => (
              <div key={i} className="animate-fadeInUp parallax-card modern-showcase-card" style={{ ...cleanCardStyle, animationDelay: `${i * 0.1}s`, padding: 24 }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 8 }}>
                  Platform Feature
                </div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>{f.title}</h4>
                <p style={{ fontSize: '0.88rem', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEETING TYPES ── */}
      <section className="home-reveal" style={{ padding: '80px 16px' }}>
        <div className="section-shell">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="badge badge-teal mb-md" style={{ margin: '0 auto 12px' }}>📅 4 Meetings / Month</div>
            <h2>JCOM Monthly <span className="highlight-gold">Meeting Framework</span></h2>
          </div>
          <div className="grid-4">
            {weekTypes.map((w, i) => (
              <div key={i} className="animate-fadeInUp parallax-card modern-showcase-card" style={{ ...cleanCardStyle, animationDelay: `${i * 0.1}s`, padding: 26, textAlign: 'left' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 12 }}>
                  {w.week}
                </div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 10, fontSize: '1.05rem' }}>{w.type}</h4>
                <p style={{ fontSize: '0.86rem', margin: 0 }}>{w.desc}</p>
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Meeting Theme</span>
                  <span style={{ fontSize: '1.25rem' }}>{w.icon}</span>
                </div>
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
      <section className="home-reveal" style={{
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

