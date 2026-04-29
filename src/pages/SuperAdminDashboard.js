import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import { PlusOutlined, CrownOutlined, CheckCircleOutlined, CloseCircleOutlined, CopyOutlined } from '@ant-design/icons';

const API = 'http://localhost:5000/api';

// ── Profile Avatar with fallback to initials ──────────────────────────────────
const ProfileAvatar = ({ member }) => {
  const [imgError, setImgError] = React.useState(false);
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
  const hasPhoto = member.profilePic && !imgError;

  return (
    <div style={{
      width: 90, height: 90, borderRadius: 16, flexShrink: 0, overflow: 'hidden',
      border: '2px solid var(--border-accent)',
      boxShadow: '0 4px 16px rgba(0,73,194,0.15)',
      background: hasPhoto ? '#f1f4f9' : 'var(--grad-gold)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative'
    }}>
      {hasPhoto ? (
        <img
          src={`http://localhost:5000${member.profilePic}`}
          alt={`${member.firstName} ${member.lastName}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.8rem', color: '#fff', letterSpacing: 1 }}>
          {initials}
        </span>
      )}
    </div>
  );
};

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('approvals');
  const [stats, setStats] = useState({});
  const [locations, setLocations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [crmMembers, setCrmMembers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [tables, setTables] = useState({});          // { locationId: [tables] }
  const [loading, setLoading] = useState(true);
  const [approveForm, setApproveForm] = useState({}); // { memberId: { tableId } }
  const [approveResult, setApproveResult] = useState(null); // { membershipId, tempPassword, name }
  const [saving, setSaving] = useState(null);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showAssignChairman, setShowAssignChairman] = useState(false);
  const [locForm, setLocForm] = useState({ name: '', code: '' });
  const [tableForm, setTableForm] = useState({ locationId: '', name: '', capacity: 60 });
  const [chairmanForm, setChairmanForm] = useState({ userId: '', locationId: '', year: new Date().getFullYear() });
  const [chairmanLocationMembers, setChairmanLocationMembers] = useState([]); // members in selected location
  const [loadingChairmanMembers, setLoadingChairmanMembers] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch everything when tab changes
  useEffect(() => { fetchAll(); }, [tab]);

  // Always fetch approved users on mount (needed for chairman assignment dropdown)
  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await axios.get(`${API}/users/all?status=Approved`, { headers });
        setApprovedUsers(res.data.users || []);
      } catch { setApprovedUsers([]); }
    };
    fetchApproved();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    // Use allSettled so a failure in one call doesn't wipe out the others
    const [statsRes, locsRes, usersRes, pendingRes] = await Promise.allSettled([
      axios.get(`${API}/admin/stats`, { headers }),
      axios.get(`${API}/admin/locations`, { headers }),
      axios.get(`${API}/users/all`, { headers }),
      axios.get(`${API}/admin/approvals`, { headers })
    ]);

    if (statsRes.status === 'fulfilled') setStats(statsRes.value.data || {});

    const locs = locsRes.status === 'fulfilled' ? (locsRes.value.data.locations || []) : [];
    setLocations(locs);

    if (usersRes.status === 'fulfilled') {
      const usersData = usersRes.value.data.users || [];
      setAllUsers(usersData);
      const approved = usersData.filter(u => u.status === 'Approved');
      if (approved.length > 0) setApprovedUsers(approved);
    }

    if (pendingRes.status === 'fulfilled') setPending(pendingRes.value.data.members || []);

    if (tab === 'crm') {
      try {
        const crmRes = await axios.get(`${API}/admin/crm-members`, { headers });
        setCrmMembers(crmRes.data.crmMembers || []);
      } catch {
        setCrmMembers([]);
      }
    }

    // Pre-load tables for each location
    if (locs.length > 0) {
      const tableMap = {};
      await Promise.all(locs.map(async (loc) => {
        try {
          const t = await axios.get(`${API}/admin/tables/${loc._id}`, { headers });
          tableMap[loc._id] = t.data.tables || [];
        } catch { tableMap[loc._id] = []; }
      }));
      setTables(tableMap);
    }

    setLoading(false);
  };

  // ── APPROVE ──
  const handleApprove = async (member) => {
    setSaving(member._id);
    try {
      const form = approveForm[member._id] || {};
      const res = await axios.patch(`${API}/auth/approve/${member._id}`, { tableId: form.tableId || null }, { headers });
      const { membershipId, tempPassword } = res.data;
      setApproveResult({ membershipId, tempPassword, name: `${member.firstName} ${member.lastName}` });
      fetchAll();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Approval failed'));
      setTimeout(() => setMsg(''), 4000);
    }
    setSaving(null);
  };

  // ── REJECT ──
  const handleReject = async (memberId) => {
    const reason = window.prompt('Reason for rejection (optional):') || 'Application not meeting requirements';
    try {
      await axios.patch(`${API}/auth/reject/${memberId}`, { reason }, { headers });
      setMsg('✅ Member rejected');
      setTimeout(() => setMsg(''), 3000);
      fetchAll();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed'));
      setTimeout(() => setMsg(''), 4000);
    }
  };

  // ── LOCATION / TABLE / CHAIRMAN ──
  const createLocation = async (e) => {
    e.preventDefault(); setFormSaving(true); setMsg('');
    try {
      await axios.post(`${API}/admin/locations`, locForm, { headers });
      setMsg('✅ Location created!'); setLocForm({ name: '', code: '' }); setShowCreateLocation(false); fetchAll();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
    setFormSaving(false);
  };
  const createTable = async (e) => {
    e.preventDefault(); setFormSaving(true); setMsg('');
    try {
      await axios.post(`${API}/admin/tables`, tableForm, { headers });
      setMsg('✅ Table created!'); setTableForm({ locationId: '', name: '', capacity: 60 }); setShowCreateTable(false); fetchAll();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
    setFormSaving(false);
  };
  const assignChairman = async (e) => {
    e.preventDefault(); setFormSaving(true); setMsg('');
    try {
      await axios.post(`${API}/admin/chairman`, chairmanForm, { headers });
      setMsg('✅ Chairman assigned!'); setChairmanForm({ userId: '', locationId: '', year: new Date().getFullYear() }); setChairmanLocationMembers([]); setShowAssignChairman(false); fetchAll();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
    setFormSaving(false);
  };

  // Fetch members for selected location in chairman assignment
  const handleChairmanLocationChange = async (locationId) => {
    setChairmanForm(f => ({ ...f, locationId, userId: '' }));
    if (!locationId) { setChairmanLocationMembers([]); return; }
    setLoadingChairmanMembers(true);
    try {
      const res = await axios.get(`${API}/admin/members/${locationId}`, { headers });
      setChairmanLocationMembers(res.data.members || []);
    } catch { setChairmanLocationMembers([]); }
    setLoadingChairmanMembers(false);
  };

  const copy = (text) => { navigator.clipboard.writeText(text); };
  const formatRevenue = (v) => {
    if (v >= 10000000) return `₹${(v/10000000).toFixed(1)} Cr`;
    if (v >= 100000) return `₹${(v/100000).toFixed(1)} L`;
    return `₹${(v||0).toLocaleString('en-IN')}`;
  };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Tables for a given member's location
  const getTablesForMember = (member) => {
    if (!member.locationId) return [];
    return tables[member.locationId] || [];
  };

  const pendingCount = pending.length;

  return (
    <SidebarLayout noPadding>
      <div style={{ padding: '80px 24px 40px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-purple mb-md" style={{ marginBottom: 8 }}>⚙️ Super Admin</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Welcome back 👋</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{user?.firstName} {user?.lastName}</h2>
          <p style={{ marginTop: 8 }}>Approve members, manage locations, tables and chairmen</p>
        </div>

        {/* Alert banner */}
        {msg && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: msg.startsWith('✅') ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', borderRadius: 10, border: `1px solid ${msg.startsWith('✅') ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`, color: msg.startsWith('✅') ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        {/* Stats row */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'Pending Approvals', value: stats.pendingMembers ?? pendingCount, icon: '⏳', accent: '#dc2626' },
            { label: 'Total Members', value: stats.totalMembers || 0, icon: '👥', accent: 'var(--primary)' },
            { label: 'Locations', value: stats.totalLocations || 0, icon: '📍', accent: 'var(--accent)' },
            { label: 'Total Revenue', value: formatRevenue(stats.totalRevenue || 0), icon: '💰', accent: '#7c3aed' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.8rem', fontWeight: 800, color: s.accent }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'approvals', label: `⏳ Pending Approvals${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { key: 'overview', label: '📊 Overview' },
            { key: 'locations', label: '📍 Locations' },
            { key: 'members', label: '👥 All Members' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
              style={t.key === 'approvals' && pendingCount > 0 && tab !== 'approvals' ? { borderColor: '#dc2626', color: '#dc2626' } : {}}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setTab('crm')}
            className={`btn btn-sm ${tab === 'crm' ? 'btn-primary' : 'btn-ghost'}`}
          >
            CRM Dashboard
          </button>
        </div>

        {/* ══════════════════ APPROVALS TAB ══════════════════ */}
        {tab === 'approvals' && (
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
              </div>
            ) : pending.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎉</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No Pending Approvals</h4>
                <p>All member applications have been reviewed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {pending.map(member => {
                  const memberTables = getTablesForMember(member);
                  return (
                    <div key={member._id} className="glass-card" style={{ borderLeft: '4px solid #dc2626' }}>
                      {/* Member info row */}
                      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
                        {/* Profile Image — large & prominent */}
                        <ProfileAvatar member={member} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                            <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{member.firstName} {member.lastName}</h4>
                            <span className="badge badge-gold">{member.businessCategory}</span>
                            <span className="badge badge-warning">⏳ Pending</span>
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{member.businessName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Applied: {formatDate(member.createdAt)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email} · {member.phone}</div>
                        </div>
                      </div>

                      {/* Detail grid */}
                      <div className="grid-2" style={{ gap: 10, marginBottom: 16 }}>
                        {[
                          ['📧 Email', member.email],
                          ['📱 Phone', member.phone],
                          ['📍 Location', member.locationName || '—'],
                          ['🪪 Aadhaar', member.aadharNumber ? `****${member.aadharNumber.slice(-4)}` : '—'],
                          ['💼 PAN', member.panNumber || '—'],
                          ['🌐 Website', member.businessWebsite || 'Not provided'],
                        ].map(([label, val]) => (
                          <div key={label} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Service description */}
                      {member.businessService && (
                        <div style={{ padding: '10px 14px', background: 'rgba(0,73,194,0.04)', borderRadius: 8, border: '1px solid rgba(0,73,194,0.15)', marginBottom: 14 }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Service Description</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.businessService}</div>
                        </div>
                      )}

                      {/* Keywords */}
                      {member.keywords?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                          {member.keywords.map((kw, ki) => (
                            <span key={ki} style={{ background: 'rgba(0,73,194,0.08)', border: '1px solid rgba(0,73,194,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', color: 'var(--primary)' }}>#{kw}</span>
                          ))}
                        </div>
                      )}

                      {/* Assign Table */}
                      <div style={{ marginBottom: 16, maxWidth: 360 }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Assign to Table <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional — can do later)</span></label>
                        <select
                          className="form-select"
                          value={approveForm[member._id]?.tableId || ''}
                          onChange={e => setApproveForm(f => ({ ...f, [member._id]: { tableId: e.target.value } }))}
                        >
                          <option value="">-- No table assignment yet --</option>
                          {memberTables.map(t => (
                            <option key={t._id} value={t._id} disabled={t.currentCount >= t.capacity}>
                              {t.name} ({t.currentCount}/{t.capacity} seats){t.currentCount >= t.capacity ? ' — FULL' : ''}
                            </option>
                          ))}
                        </select>
                        {memberTables.length === 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            ⚠️ No tables found for this member's location. <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => { setTab('locations'); setShowCreateTable(true); }}>Create Table</button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleApprove(member)}
                          disabled={saving === member._id}
                          className="btn btn-primary"
                          style={{ flex: 1, minWidth: 200 }}
                        >
                          <CheckCircleOutlined />
                          {saving === member._id ? 'Approving...' : 'Approve & Generate Membership ID'}
                        </button>
                        <button
                          onClick={() => handleReject(member._id)}
                          className="btn btn-danger btn-sm"
                          style={{ flexShrink: 0 }}
                        >
                          <CloseCircleOutlined /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="glass-card">
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>⚡ Quick Actions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '⏳', label: 'Review Pending Approvals', desc: `${pendingCount} member${pendingCount !== 1 ? 's' : ''} waiting`, action: () => setTab('approvals'), highlight: pendingCount > 0 },
                  { icon: '📍', label: 'Create New Location', desc: 'Add a new city chapter', action: () => setShowCreateLocation(true) },
                  { icon: '🗂️', label: 'Create New Table', desc: 'Add L1, L2... to a location', action: () => setShowCreateTable(true) },
                  { icon: '👑', label: 'Assign Chairman', desc: 'Assign a chairman to a location', action: () => setShowAssignChairman(true) },
                ].map((a, i) => (
                  <button key={i} onClick={a.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: a.highlight ? 'rgba(220,38,38,0.05)' : 'var(--bg-elevated)', border: `1px solid ${a.highlight ? 'rgba(220,38,38,0.3)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = a.highlight ? 'rgba(220,38,38,0.3)' : 'var(--border)'}>
                    <span style={{ fontSize: '1.6rem' }}>{a.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{a.label}</div>
                      <div style={{ fontSize: '0.75rem', color: a.highlight ? '#dc2626' : 'var(--text-muted)' }}>{a.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card">
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>📍 Locations Overview</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {locations.slice(0, 6).map((loc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#fff' }}>{loc.code}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{loc.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {loc.chairmanId ? `Chairman: ${loc.chairmanId.firstName} ${loc.chairmanId.lastName}` : '⚠️ No chairman assigned'}
                      </div>
                    </div>
                    <span className="badge badge-teal">{loc.totalMembers} members</span>
                  </div>
                ))}
                {locations.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No locations yet.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ LOCATIONS TAB ══════════════════ */}
        {tab === 'locations' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setShowCreateLocation(true)} className="btn btn-primary btn-sm"><PlusOutlined /> New Location</button>
              <button onClick={() => setShowCreateTable(true)} className="btn btn-teal btn-sm"><PlusOutlined /> New Table</button>
              <button onClick={() => setShowAssignChairman(true)} className="btn btn-outline btn-sm"><CrownOutlined /> Assign Chairman</button>
            </div>
            <div className="glass-card" style={{ padding: 0 }}>
              <table className="jcom-table">
                <thead>
                  <tr><th>Location</th><th>Code</th><th>Chairman</th><th>Year</th><th style={{ textAlign:'right' }}>Members</th><th style={{ textAlign:'right' }}>Tables</th><th style={{ textAlign:'right' }}>Revenue</th><th>History</th></tr>
                </thead>
                <tbody>
                  {locations.map((loc, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loc.name}</td>
                      <td><span className="badge badge-teal">{loc.code}</span></td>
                      <td>{loc.chairmanId ? <div><div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{loc.chairmanId.firstName} {loc.chairmanId.lastName}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{loc.chairmanId.membershipId}</div></div> : <span style={{ color: 'var(--error)', fontSize: '0.82rem' }}>⚠️ Not assigned</span>}</td>
                      <td>{loc.chairmanYear || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{loc.totalMembers}</td>
                      <td style={{ textAlign: 'right' }}>{loc.totalTables}</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>{formatRevenue(loc.totalRevenue)}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{loc.previousChairmen?.length > 0 ? `${loc.previousChairmen.length} prev.` : '—'}</td>
                    </tr>
                  ))}
                  {locations.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No locations yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════ ALL MEMBERS TAB ══════════════════ */}
        {tab === 'crm' && (
          <div className="glass-card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>CRM Dashboard</h4>
              <span className="badge badge-teal">{crmMembers.length} members</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="jcom-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Business</th>
                    <th style={{ textAlign:'right' }}>Connections</th>
                    <th style={{ textAlign:'right' }}>Given</th>
                    <th style={{ textAlign:'right' }}>Received</th>
                    <th style={{ textAlign:'right' }}>CRM Leads</th>
                    <th style={{ textAlign:'right' }}>Completed</th>
                    <th style={{ textAlign:'right' }}>Pending Value</th>
                    <th style={{ textAlign:'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {crmMembers.map((member, i) => (
                    <tr key={i}>
                      <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.firstName} {member.lastName}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.membershipId || '—'}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.role}{member.subRole ? ` • ${member.subRole}` : ''}</div></td>
                      <td><div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{member.phone || '—'}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.email || '—'}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.locationName || '—'} • {member.tableName || '—'}</div></td>
                      <td><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.businessName || '—'}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.businessCategory || '—'}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 220, whiteSpace: 'normal' }}>{member.businessService || '—'}</div></td>
                      <td style={{ textAlign:'right', fontWeight: 700 }}>{member.totalConnections || 0}</td>
                      <td style={{ textAlign:'right', color: 'var(--accent)', fontWeight: 700 }}>{member.givenRequests || 0}</td>
                      <td style={{ textAlign:'right', color: 'var(--primary)', fontWeight: 700 }}>{member.receivedRequests || 0}</td>
                      <td style={{ textAlign:'right' }}><div style={{ fontWeight: 700 }}>{member.crm?.totalEntries || 0}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Manual: {member.crm?.manualLeads || 0}</div></td>
                      <td style={{ textAlign:'right' }}><div style={{ fontWeight: 700, color: 'var(--success)' }}>{member.crm?.completed || 0}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Spoke: {member.crm?.spoke || 0}</div></td>
                      <td style={{ textAlign:'right', color: '#b45309', fontWeight: 700 }}>{formatRevenue(member.crm?.pendingValue || 0)}</td>
                      <td style={{ textAlign:'right', color: 'var(--primary)', fontWeight: 700 }}>{formatRevenue(member.totalRevenue || member.crm?.totalValue || 0)}</td>
                    </tr>
                  ))}
                  {crmMembers.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No CRM member data yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="glass-card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>All Users</h4>
              <span className="badge badge-teal">{allUsers.length} total</span>
            </div>
            <table className="jcom-table">
              <thead>
                <tr><th>Name</th><th>Membership ID</th><th>Role</th><th>Location</th><th>Business</th><th>Status</th><th style={{ textAlign:'right' }}>Revenue</th></tr>
              </thead>
              <tbody>
                {allUsers.map((u, i) => (
                  <tr key={i}>
                    <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div></td>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>{u.membershipId || '—'}</td>
                    <td>
                      <span className={`badge ${u.role === 'Chairman' ? 'badge-gold' : u.role === 'Super Admin' ? 'badge-purple' : 'badge-info'}`}>{u.role}</span>
                      {u.subRole && <span className="badge badge-teal" style={{ marginLeft: 4, fontSize: '0.65rem' }}>{u.subRole}</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{u.locationName || '—'}</td>
                    <td><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.businessName}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.businessCategory}</div></td>
                    <td><span className={`badge ${u.status === 'Approved' ? 'badge-success' : u.status === 'Pending' ? 'badge-warning' : 'badge-error'}`}>{u.status}</span></td>
                    <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>{formatRevenue(u.totalRevenue)}</td>
                  </tr>
                ))}
                {allUsers.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════ APPROVAL SUCCESS MODAL ═══════════ */}
      {approveResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card animate-fadeInUp" style={{ maxWidth: 480, width: '100%', padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Member Approved!</h3>
            <p style={{ marginBottom: 24 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{approveResult.name}</strong> is now a JCOM member.<br />
              Share these credentials with them:
            </p>

            {/* Membership ID Box */}
            <div style={{ background: 'rgba(0,73,194,0.06)', border: '2px solid var(--border-accent)', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: 8 }}>Membership ID</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: 2, marginBottom: 10 }}>
                {approveResult.membershipId}
              </div>
              <button onClick={() => copy(approveResult.membershipId)} className="btn btn-outline btn-sm">
                <CopyOutlined /> Copy ID
              </button>
            </div>

            {/* One-time Password Box */}
            <div style={{ background: 'rgba(220,38,38,0.04)', border: '2px solid rgba(220,38,38,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: '0.7rem', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: 8 }}>One-Time Password</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', letterSpacing: 3, marginBottom: 10 }}>
                {approveResult.tempPassword}
              </div>
              <button onClick={() => copy(approveResult.tempPassword)} className="btn btn-sm" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', borderRadius: 20 }}>
                <CopyOutlined /> Copy Password
              </button>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: '0.82rem', color: '#d97706', marginBottom: 20 }}>
              ⚠️ Share these credentials privately. The member should change their password after first login.
            </div>

            <button onClick={() => setApproveResult(null)} className="btn btn-primary" style={{ width: '100%' }}>
              ✅ Done
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ CREATE LOCATION MODAL ═══════════ */}
      {showCreateLocation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card-gold animate-fadeInUp" style={{ maxWidth: 440, width: '100%', padding: 32 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>📍 Create New Location</h4>
            <form onSubmit={createLocation} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">City/Location Name *</label>
                <input className="form-input" placeholder="e.g. Krishnagiri" value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Location Code *</label>
                <input className="form-input" placeholder="e.g. KRG" value={locForm.code} onChange={e => setLocForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={5} required />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Used in Membership ID format: JCOM-KRG-2026-0001</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowCreateLocation(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={formSaving} className="btn btn-primary" style={{ flex: 1 }}>{formSaving ? 'Creating...' : '✅ Create Location'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ CREATE TABLE MODAL ═══════════ */}
      {showCreateTable && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card-gold animate-fadeInUp" style={{ maxWidth: 440, width: '100%', padding: 32 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>🗂️ Create New Table</h4>
            <form onSubmit={createTable} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <select className="form-select" value={tableForm.locationId} onChange={e => setTableForm(f => ({ ...f, locationId: e.target.value }))} required>
                  <option value="">-- Select Location --</option>
                  {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Table Name *</label>
                <input className="form-input" placeholder="e.g. L1, L2, L3" value={tableForm.name} onChange={e => setTableForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (default 60)</label>
                <input type="number" className="form-input" value={tableForm.capacity} onChange={e => setTableForm(f => ({ ...f, capacity: Number(e.target.value) }))} min={1} max={100} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowCreateTable(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={formSaving} className="btn btn-primary" style={{ flex: 1 }}>{formSaving ? 'Creating...' : '✅ Create Table'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ ASSIGN CHAIRMAN MODAL ═══════════ */}
      {showAssignChairman && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card-gold animate-fadeInUp" style={{ maxWidth: 480, width: '100%', padding: 32 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>👑 Assign Chairman</h4>
            <div style={{ padding: 12, background: 'rgba(0,73,194,0.06)', borderRadius: 8, border: '1px solid var(--border-accent)', fontSize: '0.82rem', color: 'var(--primary)', marginBottom: 16 }}>
              ⚠️ Previous chairman will be archived automatically — their data is preserved.
            </div>
            <form onSubmit={assignChairman} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Step 1: Select Location */}
              <div className="form-group">
                <label className="form-label">Step 1 — Select Location *</label>
                <select
                  className="form-select"
                  value={chairmanForm.locationId}
                  onChange={e => handleChairmanLocationChange(e.target.value)}
                  required
                >
                  <option value="">-- Select Location First --</option>
                  {locations.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.name} {l.chairmanId ? `(Current: ${l.chairmanId.firstName} ${l.chairmanId.lastName})` : '(No chairman)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Member from that Location */}
              <div className="form-group">
                <label className="form-label">
                  Step 2 — Select Member from Location *
                  {loadingChairmanMembers && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>Loading...</span>}
                </label>
                <select
                  className="form-select"
                  value={chairmanForm.userId}
                  onChange={e => setChairmanForm(f => ({ ...f, userId: e.target.value }))}
                  required
                  disabled={!chairmanForm.locationId || loadingChairmanMembers}
                >
                  <option value="">{chairmanForm.locationId ? (loadingChairmanMembers ? 'Loading members...' : `-- Select from ${locations.find(l => l._id === chairmanForm.locationId)?.name || ''} --`) : '-- Pick location first --'}</option>
                  {chairmanLocationMembers.filter(u => u.role !== 'Super Admin').map(u => (
                    <option key={u._id} value={u._id}>
                      {u.firstName} {u.lastName} — {u.membershipId || u.businessCategory}
                      {u.role === 'Chairman' ? ' (Current Chairman)' : ''}
                    </option>
                  ))}
                </select>
                {chairmanForm.locationId && !loadingChairmanMembers && chairmanLocationMembers.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: 4 }}>⚠️ No approved members in this location yet.</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Year</label>
                <input type="number" className="form-input" value={chairmanForm.year} onChange={e => setChairmanForm(f => ({ ...f, year: Number(e.target.value) }))} min={2024} max={2030} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => { setShowAssignChairman(false); setChairmanLocationMembers([]); setChairmanForm({ userId: '', locationId: '', year: new Date().getFullYear() }); }} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={formSaving || !chairmanForm.userId || !chairmanForm.locationId} className="btn btn-primary" style={{ flex: 1 }}>{formSaving ? 'Assigning...' : '👑 Assign Chairman'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default SuperAdminDashboard;
