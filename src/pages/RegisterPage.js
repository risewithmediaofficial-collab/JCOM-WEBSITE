import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadOutlined, PlusOutlined, MinusCircleOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const BUSINESS_CATEGORIES = [
  'Accounting & Finance', 'Architecture & Design', 'Automobile', 'Banking & Insurance',
  'Construction & Real Estate', 'Digital Marketing', 'Education & Training', 'Engineering',
  'Fashion & Apparel', 'Food & Beverage', 'Healthcare & Medical', 'Hospitality & Tourism',
  'HR & Recruitment', 'IT & Software', 'Jewelry & Accessories', 'Legal Services',
  'Logistics & Transport', 'Manufacturing', 'Media & Entertainment', 'Printing & Publishing',
  'Retail & E-commerce', 'Security Services', 'Solar & Energy', 'Textiles', 'Travel & Tourism',
  'Wellness & Fitness', 'Other'
];

const STEPS = ['Personal Info', 'Location & Table', 'Business Info', 'Documents & Keywords', 'Review'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [locations, setLocations] = useState([]);
  const [tables, setTables] = useState([]);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    locationId: '', tableId: '',
    aadharNumber: '', panNumber: '',
    businessName: '', businessCategory: '', businessDescription: '', businessService: '', businessWebsite: '',
    profilePic: null
  });

  useEffect(() => {
    // Load locations
    axios.get(`${API}/admin/locations`).then(r => setLocations(r.data.locations || [])).catch(() => {
      setLocations([
        { _id: 'loc1', name: 'Krishnagiri' },
        { _id: 'loc2', name: 'Chennai' },
        { _id: 'loc3', name: 'Bangalore' }
      ]);
    });
  }, []);

  useEffect(() => {
    if (form.locationId) {
      axios.get(`${API}/admin/tables/${form.locationId}`).then(r => setTables(r.data.tables || [])).catch(() => setTables([]));
      setForm(f => ({ ...f, tableId: '' }));
    }
  }, [form.locationId]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleProfilePic = (e) => {
    const file = e.target.files[0];
    if (file) {
      set('profilePic', file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const addKeyword = () => {
    const kw = keyInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw) && keywords.length < 10) {
      setKeywords([...keywords, kw]);
      setKeyInput('');
    }
  };

  const removeKeyword = (kw) => setKeywords(keywords.filter(k => k !== kw));

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone) { setError('All personal fields are required'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Valid email required'); return false; }
      if (!/^[6-9]\d{9}$/.test(form.phone)) { setError('Valid 10-digit phone required'); return false; }
    }
    if (step === 1) {
      if (!form.locationId) { setError('Please select a location'); return false; }
      if (tables.length > 0 && !form.tableId) { setError('Please select a table for your location'); return false; }
    }
    if (step === 2) {
      if (!form.businessName || !form.businessCategory) { setError('Business name and category are required'); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v && k !== 'profilePic') data.append(k, v); });
      if (form.profilePic) data.append('profilePic', form.profilePic);
      data.append('keywords', keywords.join(','));

      await axios.post(`${API}/auth/register`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
          <div className="glass-card-gold animate-fadeInUp" style={{ maxWidth: 500, textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '4rem', marginBottom: 20 }}>🎉</div>
            <h2 style={{ color: 'var(--primary)', marginBottom: 12 }}>Registration Submitted!</h2>
            <p>Your application has been sent to the chairman of your selected table. You'll receive your <strong>Member ID and password</strong> after approval.</p>
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,212,170,0.08)', borderRadius: 10, border: '1px solid var(--border-teal)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>⏱️ Approval usually takes 24-48 hours</div>
            </div>
            <Link to="/" className="btn btn-primary w-full mt-xl" style={{ justifyContent: 'center' }}>Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const stepContent = [
    // Step 0: Personal Info
    <div key={0} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Profile Pic */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: profilePicPreview ? 'none' : 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', overflow: 'hidden', border: '3px solid var(--border-accent)', cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('profilePicInput').click()}>
          {profilePicPreview ? <img src={profilePicPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UploadOutlined style={{ fontSize: '2rem', color: '#000' }} />}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to upload profile photo</div>
        <input id="profilePicInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePic} />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">First Name *</label>
          <input className="form-input" placeholder="John" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name *</label>
          <input className="form-input" placeholder="Doe" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <input className="form-input" type="email" placeholder="john@business.com" value={form.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Phone Number *</label>
        <input className="form-input" type="tel" placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={10} />
      </div>
    </div>,

    // Step 1: Location & Table
    <div key={1} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: 16, background: 'rgba(0,212,170,0.08)', borderRadius: 10, border: '1px solid var(--border-teal)', fontSize: '0.85rem', color: 'var(--accent)' }}>
        💡 Each table has its own chairman. Your application will be sent to the chairman of the table you choose here.
      </div>
      <div className="form-group">
        <label className="form-label">Location *</label>
        <select className="form-select" value={form.locationId} onChange={e => set('locationId', e.target.value)}>
          <option value="">-- Select Your Location --</option>
          {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </div>
      {tables.length > 0 && (
        <div className="form-group">
          <label className="form-label">Table *</label>
          <select className="form-select" value={form.tableId} onChange={e => set('tableId', e.target.value)}>
            <option value="">-- Select Your Table --</option>
            {tables.map(t => <option key={t._id} value={t._id} disabled={t.currentCount >= t.capacity}>{t.name} ({t.currentCount}/{t.capacity} members){t.currentCount >= t.capacity ? ' - Full' : ''}</option>)}
          </select>
          {tables.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {tables.map(t => (
                <div key={t._id} style={{ padding: '6px 12px', borderRadius: 6, background: t.currentCount >= t.capacity ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${t.currentCount >= t.capacity ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, fontSize: '0.78rem', color: t.currentCount >= t.capacity ? 'var(--error)' : 'var(--success)' }}>
                  {t.name}: {t.currentCount}/{t.capacity} {t.chairmanId ? `• Chairman: ${t.chairmanId.firstName} ${t.chairmanId.lastName}` : '• No chairman yet'} {t.currentCount >= t.capacity ? '(FULL)' : ''}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Pick the table whose chairman should review your application.
          </div>
        </div>
      )}
    </div>,

    // Step 2: Business Info
    <div key={2} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="form-group">
        <label className="form-label">Business / Service Name *</label>
        <input className="form-input" placeholder="My Business Name" value={form.businessName} onChange={e => set('businessName', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Business Category *</label>
        <select className="form-select" value={form.businessCategory} onChange={e => set('businessCategory', e.target.value)}>
          <option value="">-- Select Category --</option>
          {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Business Service Description *</label>
        <textarea className="form-textarea" placeholder="Describe what services/products your business offers..." value={form.businessService} onChange={e => set('businessService', e.target.value)} rows={3} />
      </div>
      <div className="form-group">
        <label className="form-label">About Your Business</label>
        <textarea className="form-textarea" placeholder="Additional details about your business, experience, achievements..." value={form.businessDescription} onChange={e => set('businessDescription', e.target.value)} rows={3} />
      </div>
      <div className="form-group">
        <label className="form-label">Website / Portfolio Link <span style={{ color: 'var(--text-muted)' }}>(Optional)</span></label>
        <input className="form-input" type="url" placeholder="https://www.yourbusiness.com" value={form.businessWebsite} onChange={e => set('businessWebsite', e.target.value)} />
      </div>
    </div>,

    // Step 3: Documents & Keywords
    <div key={3} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: 12, background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.82rem', color: 'var(--warning)' }}>
        🔒 Your Aadhar and PAN numbers are encrypted and only visible to Super Admin. They are used for verification purposes only.
      </div>
      <div className="form-group">
        <label className="form-label">Aadhar Number</label>
        <input className="form-input" placeholder="1234 5678 9012" value={form.aadharNumber} onChange={e => set('aadharNumber', e.target.value)} maxLength={14} />
      </div>
      <div className="form-group">
        <label className="form-label">PAN Number</label>
        <input className="form-input" placeholder="ABCDE1234F" value={form.panNumber} onChange={e => set('panNumber', e.target.value)} maxLength={10} style={{ textTransform: 'uppercase' }} />
      </div>
      <div className="form-group">
        <label className="form-label">Business Keywords <span style={{ color: 'var(--text-muted)' }}>(for search visibility – max 10)</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" placeholder="e.g. tax, gst, audit..." value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())} />
          <button type="button" onClick={addKeyword} className="btn btn-teal btn-sm"><PlusOutlined /></button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {keywords.map(kw => (
            <div key={kw} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-accent)', borderRadius: 20, padding: '4px 12px', fontSize: '0.82rem', color: 'var(--primary)' }}>
              #{kw}
              <MinusCircleOutlined style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => removeKeyword(kw)} />
            </div>
          ))}
        </div>
        {keywords.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>Add keywords so members can find your business. Press Enter or + to add.</div>}
      </div>
    </div>,

    // Step 4: Review
    <div key={4} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 20, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', color: '#000', overflow: 'hidden', flexShrink: 0 }}>
            {profilePicPreview ? <img src={profilePicPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{form.firstName} {form.lastName}</div>
            <div style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{form.businessCategory}</div>
          </div>
        </div>
        {[
          ['Email', form.email], ['Phone', form.phone],
          ['Location', locations.find(l => l._id === form.locationId)?.name || '-'],
          ['Business', form.businessName], ['Service', form.businessService?.slice(0, 80) + '...'],
          ['Keywords', keywords.join(', ') || 'None added']
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0, fontWeight: 600 }}>{k}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, background: 'rgba(34,197,94,0.08)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.82rem', color: 'var(--success)' }}>
        ✅ By submitting, you agree that this information is accurate. Your application will be reviewed by the chairman of your selected table.
      </div>
    </div>
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '80px 24px 40px', background: 'radial-gradient(ellipse at 30% 30%, rgba(245,166,35,0.06),transparent 60%)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Join JCOM</h2>
            <p>Fill in the details below to submit your membership application</p>
          </div>

          {/* Step Progress */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <div style={{ flex: 1, height: 2, background: i <= step ? 'var(--primary)' : 'var(--border)' }} />}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--bg-elevated)',
                    border: `2px solid ${i <= step ? (i < step ? 'var(--success)' : 'var(--primary)') : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700, color: i <= step ? '#000' : 'var(--text-muted)',
                    transition: 'all 0.3s'
                  }}>
                    {i < step ? <CheckCircleOutlined /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? 'var(--primary)' : 'var(--border)' }} />}
                </div>
                <div style={{ fontSize: '0.65rem', color: i === step ? 'var(--primary)' : 'var(--text-muted)', marginTop: 6, fontWeight: i === step ? 700 : 400 }}>{s}</div>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="glass-card-gold animate-fadeInUp" style={{ padding: 32 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Step {step + 1}: {STEPS[step]}</h4>
            {stepContent[step]}

            {error && <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--error)', fontSize: '0.85rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost" style={{ gap: 8 }}>
                  <ArrowLeftOutlined /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={() => { if (validateStep()) setStep(s => s + 1); }} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                  Next Step →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="btn btn-primary btn-lg" style={{ marginLeft: 'auto' }}>
                  {loading ? <Loader size={22} color="#ffffff" inline label="Submitting..." /> : '🚀 Submit Application'}
                </button>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already a member? <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

