import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import { PlusOutlined, CalendarOutlined, EnvironmentOutlined, TeamOutlined, CheckCircleOutlined, QrcodeOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const MEETING_TYPES = {
  Growth:           { icon: '📈', color: '#22c55e', desc: 'Week 1 – Growth targets' },
  Problems:         { icon: '🧩', color: '#f59e0b', desc: 'Week 2 – Challenges' },
  Solutions:        { icon: '💡', color: '#3b82f6', desc: 'Week 3 – Solutions' },
  'C2C Networking': { icon: '🌐', color: '#f5a623', desc: 'Week 4 – Networking' }
};

const MeetingsPage = () => {
  const { user } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ meetingCode: '', type: 'Growth', weekNumber: 1, venue: '', time: '', contributionAmount: '', inviteCount: '', description: '' });

  // After-create success modal — shows Meeting ID + QR
  const [createdMeeting, setCreatedMeeting] = useState(null);

  // QR full-screen modal (chairman view)
  const [qrModal, setQrModal] = useState(null);

  // Join meeting modal (member)
  const [joinModal, setJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  const [msg, setMsg] = useState('');

  useBodyScrollLock(Boolean(showCreate || createdMeeting || qrModal || joinModal));

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const isChairman = user?.role === 'Chairman' || user?.role === 'Super Admin';

  useEffect(() => { fetchMeetings(); }, [filterMonth, filterYear]); // eslint-disable-line

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/meetings?month=${filterMonth}&year=${filterYear}`, { headers });
      setMeetings(res.data.meetings || []);
    } catch { setMeetings([]); }
    setLoading(false);
  };

  const openEdit = (meeting) => {
    setForm({
      meetingCode: meeting.meetingCode || '',
      type: meeting.type || 'Growth',
      weekNumber: meeting.weekNumber || 1,
      venue: meeting.venue || '',
      time: meeting.time ? new Date(new Date(meeting.time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      contributionAmount: meeting.contributionAmount || '',
      inviteCount: meeting.inviteCount || '',
      description: meeting.description || ''
    });
    setEditingId(meeting._id);
    setShowCreate(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (editingId) {
        await axios.put(`${API}/meetings/${editingId}`, form, { headers });
        setEditingId(null);
        setShowCreate(false);
        setForm({ meetingCode: '', type: 'Growth', weekNumber: 1, venue: '', time: '', contributionAmount: '', inviteCount: '', description: '' });
        fetchMeetings();
        setMsg('✅ Meeting updated successfully.');
        setTimeout(() => setMsg(''), 3000);
      } else {
        const res = await axios.post(`${API}/meetings`, form, { headers });
        setShowCreate(false);
        setForm({ meetingCode: '', type: 'Growth', weekNumber: 1, venue: '', time: '', contributionAmount: '', inviteCount: '', description: '' });
        setCreatedMeeting(res.data.meeting); // show success modal with ID + QR
        fetchMeetings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save meeting');
    }
    setCreating(false);
  };

  const handleComplete = async (meetingId) => {
    try {
      await axios.patch(`${API}/meetings/${meetingId}/complete`, {}, { headers });
      fetchMeetings();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (meeting) => {
    if (!window.confirm(`Delete "${meeting.type}" meeting scheduled on ${new Date(meeting.time).toLocaleDateString('en-IN')}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/meetings/${meeting._id}`, { headers });
      setMsg('🗑️ Meeting deleted.');
      setTimeout(() => setMsg(''), 3000);
      fetchMeetings();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to delete meeting'));
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setJoinMsg('❌ Enter a Meeting ID'); return; }
    setJoining(true); setJoinMsg('');
    try {
      const res = await axios.post(`${API}/meetings/join`, { code: joinCode.trim() }, { headers });
      setJoinMsg(res.data.message);
      setTimeout(() => { setJoinModal(false); setJoinCode(''); setJoinMsg(''); fetchMeetings(); }, 2000);
    } catch (err) {
      setJoinMsg('❌ ' + (err.response?.data?.message || 'Failed'));
    }
    setJoining(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setMsg('✅ Meeting ID copied!');
    setTimeout(() => setMsg(''), 2000);
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <SidebarLayout>
      <div style={{ padding: 'clamp(16px,3vw,32px) clamp(12px,3vw,28px) 40px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Meetings</h2>
            <p>4 structured meetings every month — Growth, Problems, Solutions, C2C Networking</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Members: Join via Meeting ID */}
            {!isChairman && (
              <button onClick={() => { setJoinModal(true); setJoinCode(''); setJoinMsg(''); }} className="btn btn-teal">
                <QrcodeOutlined /> Join with Meeting ID
              </button>
            )}
            {isChairman && (
              <button onClick={() => { setEditingId(null); setForm({ meetingCode: '', type: 'Growth', weekNumber: 1, venue: '', time: '', contributionAmount: '', inviteCount: '', description: '' }); setShowCreate(true); }} className="btn btn-primary">
                <PlusOutlined /> Schedule Meeting
              </button>
            )}
          </div>
        </div>

        {msg && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: 'var(--success)', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        {/* Month/Year Filter */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {months.map((m, i) => (
              <button key={i} onClick={() => setFilterMonth(i + 1)} className={`btn btn-sm ${filterMonth === i+1 ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 10px' }}>{m}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[2025, 2026, 2027].map(y => (
              <button key={y} onClick={() => setFilterYear(y)} className={`btn btn-sm ${filterYear === y ? 'btn-teal' : 'btn-ghost'}`} style={{ padding: '6px 12px' }}>{y}</button>
            ))}
          </div>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="grid-2">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}</div>
        ) : meetings.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No meetings scheduled</h4>
            <p>{isChairman ? 'Click "Schedule Meeting" to add meetings' : 'The chairman will schedule meetings for this month'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {meetings.map(meeting => {
              const cfg = MEETING_TYPES[meeting.type] || MEETING_TYPES.Growth;
              const hasAttended = meeting.attendees?.some(id => id === user?._id || id?.toString() === user?._id?.toString());
              return (
                <div key={meeting._id} className="glass-card" style={{ borderLeft: `4px solid ${cfg.color}` }}>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>{cfg.icon}</div>
                    <div style={{ flex: 1 }}>

                      {/* Meeting ID row */}
                      {meeting.meetingCode && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', background: 'rgba(0,73,194,0.08)', border: '1px solid var(--border-accent)', borderRadius: 6, padding: '3px 12px', color: 'var(--primary)', fontWeight: 700, letterSpacing: 1 }}>
                            🆔 {meeting.meetingCode}
                          </span>
                          <button onClick={() => copy(meeting.meetingCode)} title="Copy Meeting ID" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                            <CopyOutlined />
                          </button>
                          {/* Chairman: view QR */}
                          {isChairman && meeting.qrCode && (
                            <button onClick={() => setQrModal(meeting)} className="btn btn-ghost btn-sm" style={{ padding: '3px 10px', fontSize: '0.75rem' }}>
                              <QrcodeOutlined /> QR
                            </button>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                        <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{meeting.type}</h4>
                        {meeting.weekNumber && <span className="badge badge-gold">Week {meeting.weekNumber}</span>}
                        <span className={`badge ${meeting.status === 'Completed' ? 'badge-success' : meeting.status === 'Cancelled' ? 'badge-error' : 'badge-info'}`}>{meeting.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 20, fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span><CalendarOutlined /> {new Date(meeting.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        {meeting.venue && <span><EnvironmentOutlined /> {meeting.venue}</span>}
                        <span><TeamOutlined /> {meeting.attendedCount}/{meeting.inviteCount} attended</span>
                        {meeting.contributionAmount > 0 && <span>💰 ₹{meeting.contributionAmount.toLocaleString('en-IN')}</span>}
                      </div>
                      {meeting.description && <p style={{ marginTop: 8, fontSize: '0.85rem' }}>{meeting.description}</p>}

                      {/* Member: show mini QR + join hint when not yet attended */}
                      {!isChairman && meeting.status === 'Scheduled' && !hasAttended && meeting.qrCode && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,73,194,0.04)', border: '1px solid var(--border-accent)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={meeting.qrCode} alt="QR" style={{ width: 64, height: 64, borderRadius: 6 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: 2 }}>Scan QR or enter Meeting ID to mark attendance</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Use the <strong>"Join with Meeting ID"</strong> button above</div>
                          </div>
                        </div>
                      )}

                      {/* Attendee Names */}
                      {meeting.attendees?.length > 0 && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            👥 Attended ({meeting.attendees.length}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {meeting.attendees.map(a => (
                              <span key={a._id || a} className="badge" style={{ background: 'rgba(0,73,194,0.06)', color: 'var(--primary)', border: '1px solid var(--border-accent)', fontSize: '0.75rem' }}>
                                {a.firstName ? `${a.firstName} ${a.lastName}` : 'Unknown Member'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right-side actions */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      {!isChairman && hasAttended && (
                        <span className="badge badge-success" style={{ padding: '6px 14px' }}>✅ Attended</span>
                      )}
                      {isChairman && meeting.status === 'Scheduled' && (
                        <>
                          <button onClick={() => handleComplete(meeting._id)} className="btn btn-ghost btn-sm">
                            <CheckCircleOutlined /> Complete
                          </button>
                          <button onClick={() => openEdit(meeting)} className="btn btn-outline btn-sm">
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(meeting)}
                            className="btn btn-sm"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--error)' }}
                          >
                            <DeleteOutlined /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── JOIN MEETING MODAL (Members) ── */}
      {joinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card animate-fadeInUp" style={{ maxWidth: 440, width: '100%', padding: 36 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>📲</div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Join Meeting</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Enter the Meeting ID shared by your chairman, or scan the QR code and paste the code here
              </p>
            </div>

            {joinMsg && (
              <div style={{ padding: '10px 14px', background: joinMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${joinMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, color: joinMsg.startsWith('✅') ? 'var(--success)' : 'var(--error)', fontWeight: 600, fontSize: '0.88rem', marginBottom: 16, textAlign: 'center' }}>
                {joinMsg}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Meeting ID</label>
              <input
                className="form-input"
                placeholder="e.g.  JCOM-MTG-2026-0001"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, letterSpacing: 1, textAlign: 'center' }}
                autoFocus
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                You can find the Meeting ID on your meetings dashboard or ask your chairman
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setJoinModal(false); setJoinCode(''); setJoinMsg(''); }} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleJoin} disabled={joining || !joinCode.trim()} className="btn btn-primary" style={{ flex: 1 }}>
                {joining ? 'Joining...' : '✅ Mark Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATED MEETING SUCCESS MODAL (Chairman) ── */}
      {createdMeeting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card animate-fadeInUp" style={{ maxWidth: 420, width: '100%', padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Meeting Scheduled!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>
              Share this Meeting ID and QR with members so they can mark attendance
            </p>

            {/* Meeting ID */}
            <div style={{ background: 'rgba(0,73,194,0.06)', border: '2px solid var(--border-accent)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: 8 }}>Meeting ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: 2, marginBottom: 10 }}>
                {createdMeeting.meetingCode}
              </div>
              <button onClick={() => copy(createdMeeting.meetingCode)} className="btn btn-outline btn-sm">
                <CopyOutlined /> Copy ID
              </button>
            </div>

            {/* QR Code */}
            {createdMeeting.qrCode && (
              <div style={{ marginBottom: 20 }}>
                <img src={createdMeeting.qrCode} alt="Meeting QR" style={{ width: 180, height: 180, borderRadius: 12, border: '3px solid var(--border-accent)' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>Members can scan this QR to get the Meeting ID</div>
              </div>
            )}

            <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: '0.8rem', color: '#d97706', marginBottom: 20 }}>
              ⚠️ Share the Meeting ID with your members. They enter it to mark attendance.
            </div>

            <button onClick={() => setCreatedMeeting(null)} className="btn btn-primary" style={{ width: '100%' }}>✅ Done</button>
          </div>
        </div>
      )}

      {/* ── QR FULLSCREEN MODAL (Chairman) ── */}
      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card animate-fadeInUp" style={{ maxWidth: 380, width: '100%', padding: 32, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>{qrModal.meetingCode}</div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{qrModal.type} Meeting</h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>{qrModal.venue} · {new Date(qrModal.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <img src={qrModal.qrCode} alt="QR" style={{ width: 220, height: 220, borderRadius: 12, border: '3px solid var(--border-accent)', marginBottom: 16 }} />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>Members scan this QR to get the Meeting ID for attendance</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => copy(qrModal.meetingCode)} className="btn btn-ghost" style={{ flex: 1 }}><CopyOutlined /> Copy ID</button>
              <button onClick={() => setQrModal(null)} className="btn btn-primary" style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT MEETING MODAL (Chairman) ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card-gold animate-fadeInUp" style={{ maxWidth: 520, width: '100%', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>{editingId ? '✏️ Edit Meeting' : '📅 Schedule New Meeting'}</h4>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Meeting ID — entered manually by chairman */}
              <div className="form-group">
                <label className="form-label">Meeting ID <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                <input
                  className="form-input"
                  placeholder="e.g. JCOM-APR-W1-2026"
                  value={form.meetingCode}
                  onChange={e => setForm(f => ({ ...f, meetingCode: e.target.value.toUpperCase() }))}
                  style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Choose a unique ID — members will enter this to mark attendance (e.g. JCOM-APR-W1-2026)
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Meeting Type *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.keys(MEETING_TYPES).map(t => <option key={t} value={t}>{MEETING_TYPES[t].icon} {t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Week Number</label>
                  <select className="form-select" value={form.weekNumber} onChange={e => setForm(f => ({ ...f, weekNumber: Number(e.target.value) }))}>
                    <option value={1}>Week 1 – Growth</option>
                    <option value={2}>Week 2 – Problems</option>
                    <option value={3}>Week 3 – Solutions</option>
                    <option value={4}>Week 4 – C2C</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Venue *</label>
                <input className="form-input" placeholder="Hotel Name / Address" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time *</label>
                <input type="datetime-local" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Contribution Amount (₹)</label>
                  <input type="number" className="form-input" placeholder="500" value={form.contributionAmount} onChange={e => setForm(f => ({ ...f, contributionAmount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Invites</label>
                  <input type="number" className="form-input" placeholder="30" value={form.inviteCount} onChange={e => setForm(f => ({ ...f, inviteCount: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Agenda / Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Meeting agenda..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(0,73,194,0.06)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--primary)' }}>
                💡 A QR Code will be auto-generated from the Meeting ID you enter above. Share the ID or QR with members so they can mark attendance.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => { setShowCreate(false); setEditingId(null); }} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ flex: 1 }}>
                  {creating ? 'Saving...' : (editingId ? '💾 Save Changes' : '📅 Schedule Meeting')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default MeetingsPage;

