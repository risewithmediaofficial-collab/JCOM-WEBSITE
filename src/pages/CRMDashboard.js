import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import { EditOutlined, PlusOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const STATUS_CONFIG = {
  Lead: { label: 'Lead', color: 'badge-info' },
  InProgress: { label: 'In Progress', color: 'badge-warning' },
  Reconnect: { label: 'Reconnect', color: 'badge-purple' },
  Refollow: { label: 'Refollow', color: 'badge-teal' },
  Completed: { label: 'Completed', color: 'badge-success' },
  Cancelled: { label: 'Cancelled', color: 'badge-error' }
};

const EMPTY_STATS = {
  total: 0,
  spoke: 0,
  leads: 0,
  inProgress: 0,
  reconnect: 0,
  refollow: 0,
  completed: 0,
  cancelled: 0,
  totalValue: 0
};

const normalizeLocationName = (value) => (value || '').trim().toLowerCase();
const pageTitleStyle = {
  color: 'var(--text-primary)',
  margin: 0,
  fontSize: 'clamp(2.1rem, 4vw, 3.25rem)',
  lineHeight: 1.02,
  letterSpacing: '-0.04em',
  fontWeight: 800
};
const pageIntroStyle = {
  margin: '14px 0 0',
  maxWidth: 760,
  fontSize: '1.02rem',
  lineHeight: 1.7,
  color: 'var(--text-secondary)'
};
const sectionTitleStyle = {
  color: 'var(--text-primary)',
  margin: 0,
  fontSize: '1.08rem',
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: '-0.02em'
};
const sectionNoteStyle = {
  color: 'var(--text-muted)',
  fontSize: '0.88rem',
  lineHeight: 1.6,
  marginTop: 6,
  maxWidth: 720
};
const statCardStyle = {
  textAlign: 'center',
  minHeight: 142,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '24px 18px'
};
const statValueStyle = {
  fontFamily: "'Outfit',sans-serif",
  fontSize: 'clamp(2rem, 3vw, 2.35rem)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  lineHeight: 1.05,
  letterSpacing: '-0.03em'
};
const statLabelStyle = {
  fontSize: '0.76rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  marginTop: 10,
  lineHeight: 1.35
};

const CRMDashboard = () => {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'Super Admin';

  const [entries, setEntries] = useState([]);
  const [crmMembers, setCrmMembers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    ownerId: '',
    name: '',
    phone: '',
    email: '',
    businessName: '',
    businessCategory: '',
    status: 'Lead',
    estimatedValue: '',
    followUpDate: '',
    followUpNotes: '',
    notes: ''
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchCRM = useCallback(async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const crmRes = await axios.get(`${API}/admin/crm-members`, { headers });
        const members = crmRes.data.crmMembers || [];
        const liveLocations = crmRes.data.locations || [];

        setCrmMembers(members);
        setLocations(liveLocations);
        setEntries([]);
        setStats(EMPTY_STATS);
      } else {
        const url = filter !== 'all' ? `${API}/crm/dashboard?status=${filter}` : `${API}/crm/dashboard`;
        const res = await axios.get(url, { headers });
        setEntries(res.data.entries || []);
        setCrmMembers([]);
        setStats({ ...EMPTY_STATS, ...(res.data.stats || {}) });
      }
    } catch (err) {
      setEntries([]);
      setCrmMembers([]);
      setLocations([]);
      setStats(EMPTY_STATS);
    }
    setLoading(false);
  }, [filter, headers, isSuperAdmin]);

  useEffect(() => {
    fetchCRM();
  }, [fetchCRM]);

  const openEdit = (entry) => {
    setEditEntry(entry);
    setEditForm({
      status: entry.status,
      estimatedValue: entry.estimatedValue,
      notes: entry.notes,
      spoke: entry.spoke,
      workCompleted: entry.workCompleted
    });
    setFollowUpInput('');
    setFollowUpNote('');
  };

  const saveEntry = async () => {
    if (!editEntry) return;
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (followUpInput) {
        payload.followUpDate = followUpInput;
        payload.followUpNotes = followUpNote;
      }
      await axios.patch(`${API}/crm/entry/${editEntry._id}`, payload, { headers });
      setEditEntry(null);
      fetchCRM();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const openAddModal = () => {
    const defaultOwnerId = isSuperAdmin
      ? (selectedLocation === 'all'
          ? ''
          : (crmMembers.find((member) => String(member.locationId || '') === selectedLocation)?._id || ''))
      : '';
    setAddForm({
      ownerId: defaultOwnerId,
      name: '',
      phone: '',
      email: '',
      businessName: '',
      businessCategory: '',
      status: 'Lead',
      estimatedValue: '',
      followUpDate: '',
      followUpNotes: '',
      notes: ''
    });
    setAddError('');
    setShowAddModal(true);
  };

  const submitManualEntry = async () => {
    if (isSuperAdmin && !addForm.ownerId) {
      setAddError('Select the member who should own this manual CRM entry');
      return;
    }
    if (!addForm.name.trim()) {
      setAddError('Contact name is required');
      return;
    }
    setAddSaving(true);
    setAddError('');
    try {
      await axios.post(`${API}/crm/manual`, {
        ownerId: isSuperAdmin ? addForm.ownerId : undefined,
        name: addForm.name.trim(),
        phone: addForm.phone,
        email: addForm.email,
        businessName: addForm.businessName,
        businessCategory: addForm.businessCategory,
        status: addForm.status,
        estimatedValue: addForm.estimatedValue ? Number(addForm.estimatedValue) : 0,
        notes: addForm.notes,
        followUpDate: addForm.followUpDate || undefined,
        followUpNotes: addForm.followUpNotes
      }, { headers });
      setShowAddModal(false);
      fetchCRM();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add entry');
    }
    setAddSaving(false);
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm('Delete this manual entry? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/crm/entry/${entryId}`, { headers });
      fetchCRM();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    if (value >= 100000) return `Rs.${(value / 100000).toFixed(1)}L`;
    return `Rs.${Number(value).toLocaleString('en-IN')}`;
  };

  const filteredEntries = filter === 'all'
    ? entries
    : entries.filter((entry) => entry.status === filter);

  const selectedLocationDetails = selectedLocation === 'all'
    ? null
    : locations.find((location) => String(location._id) === String(selectedLocation));

  const overallNetworkStats = useMemo(() => (
    {
      members: crmMembers.length,
      connections: crmMembers.reduce((sum, member) => sum + (member.totalConnections || 0), 0),
      leads: crmMembers.reduce((sum, member) => sum + (member.crm?.totalEntries || 0), 0),
      attendance: crmMembers.reduce((sum, member) => sum + (member.meetingsAttended || 0), 0),
      completed: crmMembers.reduce((sum, member) => sum + (member.crm?.completed || 0), 0),
      spoke: crmMembers.reduce((sum, member) => sum + (member.crm?.spoke || 0), 0),
      revenue: crmMembers.reduce((sum, member) => sum + (member.totalRevenue || member.crm?.totalValue || 0), 0)
    }
  ), [crmMembers]);

  const locationMembers = selectedLocation === 'all'
    ? crmMembers
    : crmMembers.filter((member) => (
        String(member.locationId || '') === String(selectedLocation)
        || normalizeLocationName(member.locationName) === normalizeLocationName(selectedLocationDetails?.name)
      ));

  const filteredMembers = filter === 'all'
    ? locationMembers
    : locationMembers.filter((member) => {
        const crm = member.crm || {};
        if (filter === 'Lead') return (crm.leads || 0) > 0;
        if (filter === 'InProgress') return (crm.inProgress || 0) > 0;
        if (filter === 'Reconnect') return (crm.reconnect || 0) > 0;
        if (filter === 'Refollow') return (crm.refollow || 0) > 0;
        if (filter === 'Completed') return (crm.completed || 0) > 0;
        if (filter === 'Cancelled') return (crm.cancelled || 0) > 0;
        return true;
      });

  const superAdminStats = useMemo(() => (
    selectedLocation === 'all'
      ? (locations.length > 0 ? locations.reduce((acc, location) => {
          acc.members += location.totalMembers || 0;
          acc.connections += location.totalConnections || 0;
          acc.leads += location.totalLeads || 0;
          acc.attendance += location.attendance || 0;
          acc.completed += location.completed || 0;
          acc.revenue += location.totalRevenue || 0;
          return acc;
        }, {
          members: 0,
          connections: 0,
          leads: 0,
          attendance: 0,
          completed: 0,
          spoke: filteredMembers.reduce((sum, member) => sum + (member.crm?.spoke || 0), 0),
          revenue: 0
        }) : overallNetworkStats)
      : {
          members: selectedLocationDetails?.totalMembers || filteredMembers.length,
          connections: selectedLocationDetails?.totalConnections || filteredMembers.reduce((sum, member) => sum + (member.totalConnections || 0), 0),
          leads: selectedLocationDetails?.totalLeads || filteredMembers.reduce((sum, member) => sum + (member.crm?.totalEntries || 0), 0),
          attendance: selectedLocationDetails?.attendance || filteredMembers.reduce((sum, member) => sum + (member.meetingsAttended || 0), 0),
          completed: selectedLocationDetails?.completed || filteredMembers.reduce((sum, member) => sum + (member.crm?.completed || 0), 0),
          spoke: filteredMembers.reduce((sum, member) => sum + (member.crm?.spoke || 0), 0),
          revenue: selectedLocationDetails?.totalRevenue || filteredMembers.reduce((sum, member) => sum + (member.totalRevenue || member.crm?.totalValue || 0), 0)
        }
  ), [filteredMembers, locations, overallNetworkStats, selectedLocation, selectedLocationDetails]);

  return (
    <SidebarLayout>
      <div className="page-shell" style={{ paddingTop: 'clamp(16px, 3vw, 32px)', maxWidth: 1400 }}>
        <div className="stack-mobile" style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={pageTitleStyle}>CRM Dashboard</h2>
            <p style={pageIntroStyle}>
              {isSuperAdmin
                ? 'Live member CRM, connections, and revenue details across the full network.'
                : 'Track all your business connections, leads, and deals in one place'}
            </p>
          </div>
          {!isSuperAdmin && (
            <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <PlusOutlined /> Add Lead Manually
            </button>
          )}
        </div>

        {isSuperAdmin && (
          <div className="glass-card" style={{ marginBottom: 20, padding: 20 }}>
            <div className="responsive-split" style={{ gap: 18 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: 10 }}>Select Location</label>
                <select className="form-select" style={{ minHeight: 58, fontSize: '0.98rem', fontWeight: 600 }} value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                  <option value="all">All Locations</option>
                  {locations.map((location) => (
                    <option key={location._id || location.name} value={location._id || location.name}>{location.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, paddingTop: 20 }}>
                Showing live CRM and member revenue stats for <strong style={{ color: 'var(--text-primary)' }}>{selectedLocation === 'all' ? 'all locations' : selectedLocationDetails?.name || selectedLocation}</strong>.
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <div className="glass-card" style={{ marginBottom: 20, padding: 20 }}>
            <div className="stack-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <h4 style={sectionTitleStyle}>Overall CRM Overview</h4>
                <div style={sectionNoteStyle}>
                  Full admin CRM totals across all locations, members, connections, meetings, leads, and revenue.
                </div>
              </div>
              <span className="badge badge-teal">{crmMembers.length} members tracked</span>
            </div>
            <div className="grid-4">
              {[
                { label: 'Network Members', value: overallNetworkStats.members },
                { label: 'Network Connections', value: overallNetworkStats.connections },
                { label: 'Network Leads', value: overallNetworkStats.leads },
                { label: 'Meeting Attendance', value: overallNetworkStats.attendance },
                { label: 'Completed CRM', value: overallNetworkStats.completed },
                { label: 'Network Revenue', value: formatCurrency(overallNetworkStats.revenue) }
              ].map((item) => (
                <div key={item.label} className="stat-card" style={statCardStyle}>
                  <div style={statValueStyle}>{item.value}</div>
                  <div style={statLabelStyle}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={isSuperAdmin ? 'grid-4' : 'grid-4'} style={{ marginBottom: 28 }}>
          {(isSuperAdmin ? [
            { label: 'Members', value: superAdminStats.members, icon: 'Members' },
            { label: 'Connections Made', value: superAdminStats.connections, icon: 'Connections' },
            { label: 'Lead Generated', value: superAdminStats.leads, icon: 'Leads' },
            { label: 'Attendance', value: superAdminStats.attendance, icon: 'Attendance' },
            { label: 'Completed', value: superAdminStats.completed, icon: 'Completed' },
            { label: 'Revenue', value: formatCurrency(superAdminStats.revenue), icon: 'Revenue' }
          ] : [
            { label: 'Total Leads', value: stats.total || 0, icon: 'Target' },
            { label: 'Spoke', value: stats.spoke || 0, icon: 'Talked' },
            { label: 'Completed', value: stats.completed || 0, icon: 'Done' },
            { label: 'Total Value', value: formatCurrency(stats.totalValue || 0), icon: 'Revenue' }
          ]).map((item) => (
            <div key={item.label} className="stat-card" style={statCardStyle}>
              <div style={{ fontSize: '0.8rem', marginBottom: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{item.icon}</div>
              <div style={statValueStyle}>{item.value}</div>
              <div style={statLabelStyle}>{item.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginRight: 4 }}>
            CRM Status
          </span>
          <button onClick={() => setFilter('all')} className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}>
            All ({isSuperAdmin ? filteredMembers.length : stats.total || 0})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilter(key)} className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-ghost'}`}>
              {cfg.label} ({stats[key.charAt(0).toLowerCase() + key.slice(1)] || 0})
            </button>
          ))}
        </div>

        {isSuperAdmin && (
          <div className="glass-card" style={{ padding: 0, marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h4 style={sectionTitleStyle}>Location Summary</h4>
                <div style={sectionNoteStyle}>
                  Admin view of all locations with CRM totals, connection activity, attendance, and revenue.
                </div>
              </div>
              <span className="badge badge-gold">{locations.length} locations</span>
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="jcom-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Members</th>
                    <th>Connections</th>
                    <th>Leads</th>
                    <th>Attendance</th>
                    <th>Completed</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No location summary found yet.</td>
                    </tr>
                  ) : locations.map((location) => (
                    <tr
                      key={location._id || location.name}
                      onClick={() => setSelectedLocation(location._id || location.name)}
                      style={{ cursor: 'pointer', background: String(selectedLocation) === String(location._id || location.name) ? 'rgba(0,73,194,0.06)' : 'transparent' }}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{location.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{location.code || 'Live summary'}</div>
                      </td>
                      <td>{location.totalMembers || 0}</td>
                      <td>{location.totalConnections || 0}</td>
                      <td>{location.totalLeads || 0}</td>
                      <td>{location.attendance || 0}</td>
                      <td>{location.completed || 0}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(location.totalRevenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {isSuperAdmin ? (
              <table className="jcom-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Business</th>
                    <th>Connections</th>
                    <th>Attendance</th>
                    <th>Given</th>
                    <th>Received</th>
                    <th>CRM Leads</th>
                    <th>Spoke</th>
                    <th>Completed</th>
                    <th>Pending Value</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        No live CRM member data found.
                      </td>
                    </tr>
                  ) : filteredMembers.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {member.firstName} {member.lastName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{member.membershipId || '-'}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {member.locationName || '-'} / {member.tableName || '-'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.phone || '-'}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{member.email || '-'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.businessName || '-'}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{member.businessCategory || '-'}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{member.businessService || '-'}</div>
                      </td>
                      <td>{member.totalConnections || 0}</td>
                      <td>{member.meetingsAttended || 0}</td>
                      <td>{member.givenRequests || 0}</td>
                      <td>{member.receivedRequests || 0}</td>
                      <td>{member.crm?.totalEntries || 0}</td>
                      <td>{member.crm?.spoke || 0}</td>
                      <td>{member.crm?.completed || 0}</td>
                      <td>{formatCurrency(member.crm?.pendingValue || 0)}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(member.totalRevenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="jcom-table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Business</th>
                    <th>Status</th>
                    <th>Spoke</th>
                    <th>Next Follow-up</th>
                    <th>Est. Value</th>
                    <th>Work Done</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 60 }}>
                        <div style={{ color: 'var(--text-muted)' }}>No CRM entries yet. Connect with members to get started!</div>
                      </td>
                    </tr>
                  ) : filteredEntries.map((entry) => {
                    const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.Lead;
                    const contact = entry.isManual ? entry.manualContact : entry.contactId;
                    const displayName = entry.isManual
                      ? (contact?.name || 'Unknown')
                      : `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim();
                    const initials = entry.isManual
                      ? (contact?.name?.[0] || '?')
                      : `${contact?.firstName?.[0] || ''}${contact?.lastName?.[0] || ''}`;

                    return (
                      <tr key={entry._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: entry.isManual ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: entry.isManual ? '#fff' : '#000', flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{displayName}</span>
                                {entry.isManual && (
                                  <span style={{ fontSize: '0.62rem', background: 'rgba(102,126,234,0.15)', color: '#667eea', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>
                                    {contact?.source === 'Public Enquiry' ? 'ENQUIRY' : 'MANUAL'}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {entry.isManual ? [contact?.phone, contact?.email, contact?.location].filter(Boolean).join(' · ') : contact?.membershipId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{contact?.businessName || '-'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{contact?.businessCategory || ''}</div>
                          {entry.isManual && contact?.requirement && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 6, maxWidth: 260 }}>
                              Requirement: {contact.requirement}
                            </div>
                          )}
                        </td>
                        <td><span className={`badge ${cfg.color}`}>{cfg.label}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className={`status-dot ${entry.spoke ? 'online' : 'offline'}`} />
                            <span style={{ fontSize: '0.8rem', color: entry.spoke ? 'var(--success)' : 'var(--text-muted)' }}>{entry.spoke ? 'Yes' : 'No'}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {entry.nextFollowUpDate ? (
                            <span style={{ color: new Date(entry.nextFollowUpDate) < new Date() ? 'var(--error)' : 'var(--accent)' }}>
                              {new Date(entry.nextFollowUpDate).toLocaleDateString('en-IN')}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(entry.estimatedValue)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className={`status-dot ${entry.workCompleted ? 'online' : 'offline'}`} />
                            <span style={{ fontSize: '0.8rem' }}>{entry.workCompleted ? 'Done' : 'Pending'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openEdit(entry)} className="btn btn-ghost btn-sm">
                              <EditOutlined /> Edit
                            </button>
                            {entry.isManual && (
                              <button onClick={() => deleteEntry(entry._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                                <DeleteOutlined />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {!isSuperAdmin && showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="glass-card animate-fadeInUp" style={{ width: '100%', maxWidth: 560, padding: 'clamp(20px,4vw,32px)', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserAddOutlined style={{ color: '#fff', fontSize: '1.1rem' }} />
                </div>
                <div>
                  <h4 style={sectionTitleStyle}>Add Lead Manually</h4>
                  <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.84rem', lineHeight: 1.5 }}>Add a prospect who is not in the JCOM system yet</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>X</button>
            </div>

            {addError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--error)', fontSize: '0.85rem', marginBottom: 16 }}>
                {addError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
                <input className="form-input" placeholder="e.g. Rajesh Kumar" value={addForm.name} onChange={(e) => setAddForm((form) => ({ ...form, name: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+91 98765 43210" value={addForm.phone} onChange={(e) => setAddForm((form) => ({ ...form, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="email@example.com" value={addForm.email} onChange={(e) => setAddForm((form) => ({ ...form, email: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input className="form-input" placeholder="Company / Shop name" value={addForm.businessName} onChange={(e) => setAddForm((form) => ({ ...form, businessName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Category</label>
                  <input className="form-input" placeholder="e.g. Real Estate" value={addForm.businessCategory} onChange={(e) => setAddForm((form) => ({ ...form, businessCategory: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={addForm.status} onChange={(e) => setAddForm((form) => ({ ...form, status: e.target.value }))}>
                    {Object.keys(STATUS_CONFIG).map((status) => <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Value (Rs.)</label>
                  <input className="form-input" type="number" placeholder="0" value={addForm.estimatedValue} onChange={(e) => setAddForm((form) => ({ ...form, estimatedValue: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Schedule Follow-up</label>
                <input className="form-input" type="date" value={addForm.followUpDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setAddForm((form) => ({ ...form, followUpDate: e.target.value }))} />
              </div>
              {addForm.followUpDate && (
                <div className="form-group">
                  <label className="form-label">Follow-up Notes</label>
                  <input className="form-input" placeholder="What to discuss..." value={addForm.followUpNotes} onChange={(e) => setAddForm((form) => ({ ...form, followUpNotes: e.target.value }))} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={3} placeholder="Any additional notes about this lead..." value={addForm.notes} onChange={(e) => setAddForm((form) => ({ ...form, notes: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={submitManualEntry} disabled={addSaving} className="btn btn-primary" style={{ flex: 1 }}>
                {addSaving ? 'Adding...' : '+ Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isSuperAdmin && editEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card-gold animate-fadeInUp" style={{ maxWidth: 500, width: '100%', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>
              Update: {editEntry.isManual ? editEntry.manualContact?.name : `${editEntry.contactId?.firstName} ${editEntry.contactId?.lastName}`}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editForm.status} onChange={(e) => setEditForm((form) => ({ ...form, status: e.target.value }))}>
                  {Object.keys(STATUS_CONFIG).map((status) => <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={editForm.spoke} onChange={(e) => setEditForm((form) => ({ ...form, spoke: e.target.checked }))} /> Spoke
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={editForm.workCompleted} onChange={(e) => setEditForm((form) => ({ ...form, workCompleted: e.target.checked }))} /> Work Completed
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Value (Rs.)</label>
                <input type="number" className="form-input" value={editForm.estimatedValue || ''} onChange={(e) => setEditForm((form) => ({ ...form, estimatedValue: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Schedule Follow-up</label>
                <input type="date" className="form-input" value={followUpInput} onChange={(e) => setFollowUpInput(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              {followUpInput && (
                <div className="form-group">
                  <label className="form-label">Follow-up Notes</label>
                  <input className="form-input" placeholder="What to discuss..." value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={3} value={editForm.notes || ''} onChange={(e) => setEditForm((form) => ({ ...form, notes: e.target.value }))} placeholder="Internal notes about this connection..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setEditEntry(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={saveEntry} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default CRMDashboard;

