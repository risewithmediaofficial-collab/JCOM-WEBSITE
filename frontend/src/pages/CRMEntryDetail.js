import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import Loader from '../components/Loader';
import ProfileAvatar from '../components/ProfileAvatar';
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

const sectionCardStyle = {
  padding: 22,
  borderRadius: 18,
  border: '1px solid var(--border)',
  background: '#fbfcff'
};

const formatCurrency = (value) => {
  if (!value) return '-';
  if (value >= 100000) return `Rs.${(value / 100000).toFixed(1)}L`;
  return `Rs.${Number(value).toLocaleString('en-IN')}`;
};

const formatFollowUpDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN');
};

const buildFormState = (crmEntry = {}) => ({
  status: crmEntry.status || 'Lead',
  estimatedValue: crmEntry.estimatedValue || '',
  confirmedValue: crmEntry.confirmedValue || '',
  notes: crmEntry.notes || '',
  spoke: Boolean(crmEntry.spoke),
  workCompleted: Boolean(crmEntry.workCompleted)
});

const buildManualContactState = (crmEntry = {}) => ({
  name: crmEntry.manualContact?.name || '',
  phone: crmEntry.manualContact?.phone || '',
  email: crmEntry.manualContact?.email || '',
  location: crmEntry.manualContact?.location || '',
  requirement: crmEntry.manualContact?.requirement || '',
  businessName: crmEntry.manualContact?.businessName || '',
  businessCategory: crmEntry.manualContact?.businessCategory || ''
});

const CRMEntryDetail = () => {
  const { entryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const initialEntry = location.state?.entry || null;

  const [entry, setEntry] = useState(initialEntry);
  const [loading, setLoading] = useState(!initialEntry);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(buildFormState(initialEntry));
  const [manualContact, setManualContact] = useState(buildManualContactState(initialEntry));
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  const hydrateEntry = (nextEntry) => {
    setEntry(nextEntry);
    setForm(buildFormState(nextEntry));
    setManualContact(buildManualContactState(nextEntry));
  };

  const loadEntry = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/crm/entry/${entryId}`, { headers });
      return response.data.entry;
    } catch (requestError) {
      const response = await axios.get(`${API}/crm/dashboard`, { headers });
      const matchedEntry = (response.data.entries || []).find((crmEntry) => String(crmEntry._id) === String(entryId));

      if (!matchedEntry) {
        throw requestError;
      }

      return matchedEntry;
    }
  }, [entryId, headers]);

  useEffect(() => {
    const fetchEntry = async () => {
      if (!initialEntry) {
        setLoading(true);
      }
      setError('');
      try {
        const nextEntry = await loadEntry();
        hydrateEntry(nextEntry);
        setError('');
      } catch (requestError) {
        if (!initialEntry) {
          setError(requestError.response?.data?.message || 'Unable to load CRM entry');
        } else {
          setError('');
        }
      }
      setLoading(false);
    };

    fetchEntry();
  }, [initialEntry, loadEntry]);

  const saveEntry = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        ...form,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : 0,
        confirmedValue: form.confirmedValue ? Number(form.confirmedValue) : 0
      };

      if (followUpInput) {
        payload.followUpDate = followUpInput;
        payload.followUpNotes = followUpNote;
      }

      if (entry?.isManual) {
        payload.manualContact = manualContact;
      }

      await axios.patch(`${API}/crm/entry/${entryId}`, payload, { headers });
      const refreshedEntry = await loadEntry();
      hydrateEntry(refreshedEntry);
      setMessage('CRM entry updated successfully');
      setFollowUpInput('');
      setFollowUpNote('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to save CRM entry');
    }

    setSaving(false);
  };

  const deleteEntry = async () => {
    if (!entry?.isManual) return;
    if (!window.confirm('Delete this CRM entry? This cannot be undone.')) return;

    setDeleting(true);
    setError('');
    try {
      await axios.delete(`${API}/crm/entry/${entryId}`, { headers });
      navigate('/crm');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to delete CRM entry');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="page-shell">
          <div className="glass-card" style={{ padding: 28 }}>
            <Loader minHeight="200px" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!entry) {
    return (
      <SidebarLayout>
        <div className="page-shell">
          <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>CRM entry not found</h3>
            <p>{error || 'This CRM item could not be opened.'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/crm')}>Back to CRM</button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const contact = entry.isManual ? entry.manualContact : entry.contactId;
  const displayName = entry.isManual
    ? contact?.name || 'Unknown Contact'
    : `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim();
  const subtitle = entry.isManual
    ? contact?.source || 'Manual Entry'
    : contact?.membershipId || 'JCOM Member';
  const statusConfig = STATUS_CONFIG[form.status] || STATUS_CONFIG.Lead;

  return (
    <SidebarLayout>
      <div className="page-shell" style={{ maxWidth: 1200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/crm')} style={{ marginBottom: 12 }}>Back to CRM</button>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>{displayName}</h2>
            <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)' }}>
              {subtitle} {contact?.businessName ? `• ${contact.businessName}` : ''}
            </p>
          </div>
          <div />
        </div>

        {(message || error) && (
          <div style={{
            marginBottom: 18,
            padding: '12px 14px',
            borderRadius: 10,
            background: message ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: message ? 'var(--success)' : 'var(--error)'
          }}>
            {message || error}
          </div>
        )}

        <div className="responsive-split" style={{ alignItems: 'start', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <ProfileAvatar
                src={entry.isManual ? '' : contact?.profilePic}
                firstName={entry.isManual ? displayName : contact?.firstName}
                lastName={entry.isManual ? '' : contact?.lastName}
                alt={displayName}
                size={84}
                borderRadius="50%"
                fontSize={28}
              />
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem' }}>{displayName}</div>
                <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>{subtitle}</div>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={sectionCardStyle}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>Contact</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{contact?.phone || '-'}</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{contact?.email || '-'}</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{contact?.location || contact?.locationName || '-'}</div>
              </div>

              <div style={sectionCardStyle}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>Business</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{contact?.businessName || '-'}</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{contact?.businessCategory || '-'}</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{contact?.businessService || contact?.requirement || '-'}</div>
              </div>

              <div style={sectionCardStyle}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>CRM Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><strong>Spoke:</strong> {form.spoke ? 'Yes' : 'No'}</div>
                  <div><strong>Work Done:</strong> {form.workCompleted ? 'Done' : 'Pending'}</div>
                  <div><strong>Est. Value:</strong> {formatCurrency(form.estimatedValue)}</div>
                  <div><strong>Confirmed:</strong> {formatCurrency(form.confirmedValue)}</div>
                  <div><strong>Next Follow-up:</strong> {entry.nextFollowUpDate ? new Date(entry.nextFollowUpDate).toLocaleDateString('en-IN') : '-'}</div>
                  <div><strong>Created:</strong> {new Date(entry.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Edit CRM Details</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {entry.isManual && (
                  <button className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={deleteEntry} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
                <button className="btn btn-primary" onClick={saveEntry} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {entry.isManual && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Manual Contact Details</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={manualContact.name} onChange={(e) => setManualContact((current) => ({ ...current, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={manualContact.phone} onChange={(e) => setManualContact((current) => ({ ...current, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={manualContact.email} onChange={(e) => setManualContact((current) => ({ ...current, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={manualContact.location} onChange={(e) => setManualContact((current) => ({ ...current, location: e.target.value }))} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <input className="form-input" value={manualContact.businessName} onChange={(e) => setManualContact((current) => ({ ...current, businessName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Category</label>
                    <input className="form-input" value={manualContact.businessCategory} onChange={(e) => setManualContact((current) => ({ ...current, businessCategory: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Requirement / Spoke Details</label>
                  <textarea className="form-textarea" rows={3} value={manualContact.requirement} onChange={(e) => setManualContact((current) => ({ ...current, requirement: e.target.value }))} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}>
                {Object.keys(STATUS_CONFIG).map((status) => (
                  <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.spoke} onChange={(e) => setForm((current) => ({ ...current, spoke: e.target.checked }))} /> Spoke
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.workCompleted} onChange={(e) => setForm((current) => ({ ...current, workCompleted: e.target.checked }))} /> Work Completed
              </label>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Estimated Value (Rs.)</label>
                <input className="form-input" type="number" value={form.estimatedValue} onChange={(e) => setForm((current) => ({ ...current, estimatedValue: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmed Value (Rs.)</label>
                <input className="form-input" type="number" value={form.confirmedValue} onChange={(e) => setForm((current) => ({ ...current, confirmedValue: e.target.value }))} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Add Follow-up Date</label>
                <input className="form-input" type="date" value={followUpInput} min={new Date().toISOString().split('T')[0]} onChange={(e) => setFollowUpInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Call / Follow-up Note</label>
                <input className="form-input" value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} placeholder="What was spoken in this call / next step" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Internal Notes / Work Done</label>
              <textarea className="form-textarea" rows={4} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Add the call discussion, updates, and work done. Each saved update will be kept in history." />
            </div>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Follow-up History</h4>
              <div style={{ display: 'grid', gap: 10 }}>
                {(entry.followUps || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>No follow-ups added yet.</div>
                ) : (
                  [...entry.followUps].slice().reverse().map((followUp, index) => (
                    <div key={`${followUp.date}-${index}`} style={sectionCardStyle}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatFollowUpDate(followUp.date)}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{followUp.notes || 'No notes added'}</div>
                      {followUp.internalNotes && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Work done:</strong> {followUp.internalNotes}
                        </div>
                      )}
                      {followUp.nextFollowUpDate && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Next follow-up:</strong> {formatFollowUpDate(followUp.nextFollowUpDate)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CRMEntryDetail;
