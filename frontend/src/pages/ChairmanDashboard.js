import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import { CheckCircleOutlined, CloseCircleOutlined, CrownOutlined } from '@ant-design/icons';
import ProfileAvatar from '../components/ProfileAvatar';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import Loader from '../components/Loader';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const ChairmanDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('approvals');
  const [pending, setPending] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approveForm, setApproveForm] = useState({});
  const [tables, setTables] = useState([]);
  const [msg, setMsg] = useState('');
  const [roleModal, setRoleModal] = useState(null); // member to assign sub-role
  const [selectedSubRole, setSelectedSubRole] = useState('');
  useBodyScrollLock(Boolean(roleModal));

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);
    try {
      if (tab === 'approvals') {
        const [pendingRes, tablesRes] = await Promise.all([
          axios.get(`${API}/admin/approvals`, { headers }),
          user?.locationId ? axios.get(`${API}/admin/tables/${user.locationId}`, { headers }) : Promise.resolve({ data: { tables: [] } })
        ]);
        setPending(pendingRes.data.members || []);
        setTables(tablesRes.data.tables || []);
      } else if (tab === 'members') {
        const res = await axios.get(`${API}/admin/members/${user?.locationId}`, { headers });
        setMembers(res.data.members || []);
      }
    } catch (err) {
      setPending([]); setMembers([]);
    }
    setLoading(false);
  }, [tab, user?.locationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (memberId) => {
    const form = approveForm[memberId] || {};
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.patch(`${API}/auth/approve/${memberId}`, { tableId: form.tableId }, { headers });
      const { membershipId, tempPassword } = res.data;
      setMsg(`✅ Approved! Member ID: ${membershipId} | Temp Password: ${tempPassword}`);
      fetchData();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Approval failed'));
    }
  };

  const handleReject = async (memberId, reason) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`${API}/auth/reject/${memberId}`, { reason: reason || 'Application not meeting requirements' }, { headers });
      setMsg('✅ Member rejected');
      fetchData();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Reject failed'));
    }
  };

  const handleSubRoleAssign = async () => {
    if (!roleModal) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`${API}/users/assign-role`, { userId: roleModal._id, subRole: selectedSubRole || null }, { headers });
      setMsg(`✅ Sub-role ${selectedSubRole || 'cleared'} assigned to ${roleModal.firstName}`);
      setRoleModal(null);
      fetchData();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to assign sub-role'));
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const chairmanTables = user?.tableId ? tables.filter((table) => table._id === user.tableId) : tables;

  return (
    <SidebarLayout noPadding>
      <div className="page-shell" style={{ maxWidth: 1300 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-gold mb-md" style={{ marginBottom: 8 }}>👑 Chairman Dashboard</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Welcome back 👋</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{user?.firstName} {user?.lastName}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="badge badge-gold">{user?.membershipId}</span>
            <span className="badge badge-teal">📍 {user?.locationName} {user?.tableName ? `• ${user.tableName}` : 'Chapter'}</span>
          </div>
          <p>Manage member applications and members for your assigned table</p>
        </div>

        {msg && <div style={{ marginBottom: 20, padding: '14px 18px', background: msg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 10, border: `1px solid ${msg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.startsWith('✅') ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>{msg}</div>}

        {/* Tabs */}
        <div className="responsive-actions" style={{ marginBottom: 20 }}>
          {[
            { key: 'approvals', label: `⏳ Pending Approvals ${pending.length > 0 ? `(${pending.length})` : ''}` },
            { key: 'members', label: '👥 Members List' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}>{t.label}</button>
          ))}
        </div>

        {/* APPROVALS TAB */}
        {tab === 'approvals' && (
          loading ? <div className="glass-card" style={{ padding: 40 }}><Loader minHeight="clamp(180px, 28vw, 260px)" /></div> :
          pending.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No Pending Approvals</h4>
              <p>All member applications have been reviewed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {pending.map(member => (
                <div key={member._id} className="glass-card">
                  {/* Member Overview */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
                    <ProfileAvatar
                      src={member.profilePic}
                      firstName={member.firstName}
                      lastName={member.lastName}
                      alt="Profile"
                      size={56}
                      borderRadius="50%"
                      fontSize={22}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{member.firstName} {member.lastName}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{member.businessCategory}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Applied: {formatDate(member.createdAt)}</div>
                    </div>
                    <span className="badge badge-warning">⏳ Pending Review</span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
                    {[
                      ['📧 Email', member.email],
                      ['📱 Phone', member.phone],
                      ['🏢 Business', member.businessName],
                      ['🌐 Website', member.businessWebsite || 'Not provided'],
                    ].map(([label, val]) => (
                      <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Business Description */}
                  {member.businessService && (
                    <div style={{ padding: '12px 14px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, border: '1px solid var(--border-teal)', marginBottom: 16 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Description</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.businessService}</div>
                    </div>
                  )}

                  {/* Keywords */}
                  {member.keywords?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {member.keywords.map((kw, ki) => <span key={ki} style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-accent)', borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', color: 'var(--primary)' }}>#{kw}</span>)}
                    </div>
                  )}

                  {/* Assign Table */}
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Assign to Table</label>
                    <select className="form-select" value={approveForm[member._id]?.tableId || ''} onChange={e => setApproveForm(f => ({ ...f, [member._id]: { ...f[member._id], tableId: e.target.value } }))}>
                      <option value="">-- Select table --</option>
                      {chairmanTables.map(t => <option key={t._id} value={t._id} disabled={t.currentCount >= t.capacity}>{t.name} ({t.currentCount}/{t.capacity}) {t.currentCount >= t.capacity ? '(FULL)' : ''}</option>)}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="stack-mobile" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button onClick={() => handleApprove(member._id)} className="btn btn-primary w-full-sm" style={{ flex: 1 }}>
                      <CheckCircleOutlined /> Approve & Generate Member ID
                    </button>
                    <button onClick={() => { const reason = prompt('Reason for rejection (optional):'); handleReject(member._id, reason); }} className="btn btn-danger w-full-sm" style={{ flex: '0 0 auto' }}>
                      <CloseCircleOutlined /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <div className="glass-card" style={{ padding: 0 }}>
            <div className="stack-mobile" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Members — {user?.tableName || user?.locationName}</h4>
              <span className="badge badge-teal">{members.length} approved</span>
            </div>
            <div className="jcom-table-wrap">
              <table className="jcom-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Membership ID</th>
                    <th>Table</th>
                    <th>Business</th>
                    <th>Sub-Role</th>
                    <th style={{ textAlign: 'right' }}>Connections</th>
                    <th style={{ textAlign: 'right' }}>Revenue</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}><Loader minHeight="120px" /></td></tr>
                  ) : members.map((m, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem', color: '#000', flexShrink: 0 }}>
                            {m.firstName?.[0]}{m.lastName?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{m.firstName} {m.lastName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.businessCategory}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.membershipId}</td>
                      <td><span className="badge badge-teal">{m.tableName || '—'}</span></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.businessName}</td>
                      <td>
                        {m.subRole
                          ? <span className="badge badge-info">{m.subRole}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                        }
                      </td>
                      <td style={{ textAlign: 'right' }}>{m.totalConnections}</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>
                        {m.totalRevenue >= 100000 ? `₹${(m.totalRevenue/100000).toFixed(1)}L` : `₹${(m.totalRevenue||0).toLocaleString('en-IN')}`}
                      </td>
                      <td>
                        <button onClick={() => { setRoleModal(m); setSelectedSubRole(m.subRole || ''); }} className="btn btn-ghost btn-sm">
                          <CrownOutlined /> Role
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && members.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No approved members yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SUB-ROLE ASSIGNMENT MODAL */}
      {roleModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card-gold animate-fadeInUp modal-sheet" style={{ maxWidth: 400, width: '100%', padding: 32 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>
              Assign Sub-Role: {roleModal.firstName} {roleModal.lastName}
            </h4>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>This is a trademark badge displayed on their profile. Does not change login access.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {['', 'Vice Chairman', 'Director', 'Treasurer'].map(role => (
                <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: selectedSubRole === role ? 'rgba(245,166,35,0.1)' : 'var(--bg-elevated)', borderRadius: 10, border: `1px solid ${selectedSubRole === role ? 'var(--border-accent)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="radio" name="subRole" value={role} checked={selectedSubRole === role} onChange={() => setSelectedSubRole(role)} style={{ accentColor: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{role || 'None (Clear Sub-role)'}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="stack-mobile" style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setRoleModal(null)} className="btn btn-ghost w-full-sm" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleSubRoleAssign} className="btn btn-primary" style={{ flex: 1 }}>✅ Assign</button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default ChairmanDashboard;


