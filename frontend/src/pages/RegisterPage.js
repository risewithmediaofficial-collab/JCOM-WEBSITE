import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  UploadOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import ProfileAvatar from '../components/ProfileAvatar';
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
const MOBILE_STEPS = ['Personal', 'Location', 'Business', 'Docs', 'Review'];

const buildProfileSlugPreview = (value = '') => {
  const slug = String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

  return slug || 'yourprofile';
};

const RegisterPage = () => {
  const [step, setStep] = useState(0);
  const [locations, setLocations] = useState([]);
  const [tables, setTables] = useState([]);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submissionMeta, setSubmissionMeta] = useState({ approvalTarget: 'chairman', approvalMessage: '' });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    locationId: '',
    tableId: '',
    aadharNumber: '',
    panNumber: '',
    businessName: '',
    profileName: '',
    businessCategory: '',
    businessDescription: '',
    businessService: '',
    businessWebsite: '',
    profilePic: null
  });

  useEffect(() => {
    axios.get(`${API}/admin/locations`).then((response) => {
      setLocations(response.data.locations || []);
    }).catch(() => {
      setLocations([
        { _id: 'loc1', name: 'Krishnagiri' },
        { _id: 'loc2', name: 'Chennai' },
        { _id: 'loc3', name: 'Bangalore' }
      ]);
    });
  }, []);

  useEffect(() => {
    if (!form.locationId) {
      setTables([]);
      return;
    }

    axios.get(`${API}/admin/tables/${form.locationId}`).then((response) => {
      setTables(response.data.tables || []);
    }).catch(() => {
      setTables([]);
    });

    setForm((current) => ({ ...current, tableId: '' }));
  }, [form.locationId]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const selectedLocationName = useMemo(
    () => locations.find((location) => location._id === form.locationId)?.name || '',
    [form.locationId, locations]
  );

  const publicProfilePreview = useMemo(() => {
    const slug = buildProfileSlugPreview(form.profileName);
    if (typeof window === 'undefined') return `your-domain.com/${slug}`;
    return `${window.location.origin}/${slug}`;
  }, [form.profileName]);

  const selectedTable = useMemo(
    () => tables.find((table) => table._id === form.tableId) || null,
    [form.tableId, tables]
  );

  const locationHasAnyChairman = useMemo(
    () => tables.some((table) => Boolean(table.chairmanId)),
    [tables]
  );

  const approvalHint = useMemo(() => {
    if (!form.locationId) {
      return 'Each table has its own chairman. Your application will be sent to the chairman of the table you choose here.';
    }

    if (selectedTable) {
      return selectedTable.chairmanId
        ? 'This table already has a chairman. Your application will be sent to that chairman for approval.'
        : 'This table does not have a chairman yet. Your application will go to Super Admin for approval.';
    }

    if (tables.length === 0 || !locationHasAnyChairman) {
      return 'This location does not have a chairman assigned yet. Your application will go to Super Admin for approval.';
    }

    return 'Choose your table to route the application to the correct chairman.';
  }, [form.locationId, locationHasAnyChairman, selectedTable, tables.length]);

  const handleProfilePic = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setField('profilePic', file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const addKeyword = () => {
    const keyword = keyInput.trim().toLowerCase();
    if (!keyword || keywords.includes(keyword) || keywords.length >= 10) return;
    setKeywords((current) => [...current, keyword]);
    setKeyInput('');
  };

  const removeKeyword = (keyword) => {
    setKeywords((current) => current.filter((item) => item !== keyword));
  };

  const validateStep = () => {
    setError('');

    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone) {
        setError('All personal fields are required');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError('Valid email required');
        return false;
      }
      if (!/^[6-9]\d{9}$/.test(form.phone)) {
        setError('Valid 10-digit phone required');
        return false;
      }
    }

    if (step === 1) {
      if (!form.locationId) {
        setError('Please select a location');
        return false;
      }
      if (tables.length > 0 && !form.tableId) {
        setError('Please select a table for your location');
        return false;
      }
    }

    if (step === 2) {
      if (!form.businessName || !form.profileName || !form.businessCategory) {
        setError('Business name, profile name, and category are required');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value && key !== 'profilePic') data.append(key, value);
      });
      if (form.profilePic) data.append('profilePic', form.profilePic);
      data.append('keywords', keywords.join(','));

      const response = await axios.post(`${API}/auth/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmissionMeta({
        approvalTarget: response.data.approvalTarget || 'chairman',
        approvalMessage: response.data.approvalMessage || 'Registration submitted successfully. Awaiting chairman approval.'
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed. Please try again.');
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
          <div className="glass-card-gold animate-fadeInUp" style={{ maxWidth: 520, textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '4rem', marginBottom: 20 }}>Submitted</div>
            <h2 style={{ color: 'var(--primary)', marginBottom: 12 }}>Registration Submitted!</h2>
            <p>
              {submissionMeta.approvalTarget === 'super_admin'
                ? 'No chairman is assigned for your selected location or table yet, so your application has been sent to the Super Admin for approval.'
                : 'Your application has been sent to the chairman of your selected table. You will receive your Member ID and password after approval.'}
            </p>
            {submissionMeta.approvalMessage && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(39,162,222,0.08)', border: '1px solid rgba(39,162,222,0.18)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {submissionMeta.approvalMessage}
              </div>
            )}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(39,162,222,0.08)', border: '1px solid rgba(39,162,222,0.18)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Requested public profile URL: <strong style={{ color: 'var(--primary)' }}>{publicProfilePreview}</strong>
            </div>
            <Link to="/" className="btn btn-primary w-full mt-xl" style={{ justifyContent: 'center' }}>Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const stepContent = [
    <div key={0} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: profilePicPreview ? 'none' : 'var(--grad-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            overflow: 'hidden',
            border: '3px solid var(--border-accent)',
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('profilePicInput')?.click()}
        >
          {profilePicPreview
            ? <img src={profilePicPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <UploadOutlined style={{ fontSize: '2rem', color: '#000' }} />}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to upload profile photo</div>
        <input id="profilePicInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePic} />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">First Name *</label>
          <input className="form-input" placeholder="John" value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name *</label>
          <input className="form-input" placeholder="Doe" value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <input className="form-input" type="email" placeholder="john@business.com" value={form.email} onChange={(event) => setField('email', event.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Phone Number *</label>
        <input className="form-input" type="tel" placeholder="9876543210" value={form.phone} onChange={(event) => setField('phone', event.target.value)} maxLength={10} />
      </div>
    </div>,

    <div key={1} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: 16, background: 'rgba(0,212,170,0.08)', borderRadius: 10, border: '1px solid var(--border-teal)', fontSize: '0.85rem', color: 'var(--accent)' }}>
        {approvalHint}
      </div>

      <div className="form-group">
        <label className="form-label">Location *</label>
        <select className="form-select" value={form.locationId} onChange={(event) => setField('locationId', event.target.value)}>
          <option value="">-- Select Your Location --</option>
          {locations.map((location) => (
            <option key={location._id} value={location._id}>{location.name}</option>
          ))}
        </select>
      </div>

      {tables.length > 0 && (
        <div className="form-group">
          <label className="form-label">Table *</label>
          <select className="form-select" value={form.tableId} onChange={(event) => setField('tableId', event.target.value)}>
            <option value="">-- Select Your Table --</option>
            {tables.map((table) => (
              <option key={table._id} value={table._id} disabled={table.currentCount >= table.capacity}>
                {table.name} ({table.currentCount}/{table.capacity} members){table.currentCount >= table.capacity ? ' - Full' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>,

    <div key={2} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="form-group">
        <label className="form-label">Business / Service Name *</label>
        <input className="form-input" placeholder="My Business Name" value={form.businessName} onChange={(event) => setField('businessName', event.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Profile Name *</label>
        <input className="form-input" placeholder="dineshmarketing" value={form.profileName} onChange={(event) => setField('profileName', event.target.value)} />
        <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(39,162,222,0.08)', border: '1px solid rgba(39,162,222,0.18)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Public profile preview: <strong style={{ color: 'var(--primary)' }}>{publicProfilePreview}</strong>
        </div>
        <div style={{ marginTop: 6, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          This is separate from the business name and will be used in the profile URL.
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Business Category *</label>
        <select className="form-select" value={form.businessCategory} onChange={(event) => setField('businessCategory', event.target.value)}>
          <option value="">-- Select Category --</option>
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Business Service Description *</label>
        <textarea className="form-textarea" placeholder="Describe what services/products your business offers..." value={form.businessService} onChange={(event) => setField('businessService', event.target.value)} rows={3} />
      </div>

      <div className="form-group">
        <label className="form-label">About Your Business</label>
        <textarea className="form-textarea" placeholder="Additional details about your business, experience, achievements..." value={form.businessDescription} onChange={(event) => setField('businessDescription', event.target.value)} rows={3} />
      </div>

      <div className="form-group">
        <label className="form-label">Website / Portfolio Link <span style={{ color: 'var(--text-muted)' }}>(Optional)</span></label>
        <input className="form-input" type="url" placeholder="https://www.yourbusiness.com" value={form.businessWebsite} onChange={(event) => setField('businessWebsite', event.target.value)} />
      </div>
    </div>,

    <div key={3} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: 12, background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.82rem', color: 'var(--warning)' }}>
        Your Aadhar and PAN numbers are encrypted and only visible to Super Admin. They are used for verification purposes only.
      </div>

      <div className="form-group">
        <label className="form-label">Aadhar Number</label>
        <input className="form-input" placeholder="1234 5678 9012" value={form.aadharNumber} onChange={(event) => setField('aadharNumber', event.target.value)} maxLength={14} />
      </div>

      <div className="form-group">
        <label className="form-label">PAN Number</label>
        <input className="form-input" placeholder="ABCDE1234F" value={form.panNumber} onChange={(event) => setField('panNumber', event.target.value)} maxLength={10} style={{ textTransform: 'uppercase' }} />
      </div>

      <div className="form-group">
        <label className="form-label">Business Keywords <span style={{ color: 'var(--text-muted)' }}>(for search visibility - max 10)</span></label>
        <div className="register-keyword-row">
          <input
            className="form-input"
            placeholder="e.g. tax, gst, audit..."
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addKeyword();
              }
            }}
          />
          <button type="button" onClick={addKeyword} className="btn btn-teal btn-sm register-keyword-add"><PlusOutlined /></button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {keywords.map((keyword) => (
            <div key={keyword} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-accent)', borderRadius: 20, padding: '4px 12px', fontSize: '0.82rem', color: 'var(--primary)' }}>
              #{keyword}
              <MinusCircleOutlined style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => removeKeyword(keyword)} />
            </div>
          ))}
        </div>
      </div>
    </div>,

    <div key={4} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 20, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div className="register-review-header">
          <ProfileAvatar
            src={profilePicPreview}
            firstName={form.firstName}
            lastName={form.lastName}
            alt="Profile"
            size={60}
            borderRadius="50%"
            fontSize={20}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{form.firstName} {form.lastName}</div>
            <div style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{form.businessCategory}</div>
          </div>
        </div>

        {[
          ['Email', form.email],
          ['Phone', form.phone],
          ['Location', selectedLocationName || '-'],
          ['Business Name', form.businessName],
          ['Profile Name', form.profileName],
          ['Public URL', publicProfilePreview],
          ['Service', form.businessService || '-'],
          ['Keywords', keywords.join(', ') || 'None added']
        ].map(([label, value]) => (
          <div key={label} className="register-review-row">
            <span className="register-review-label">{label}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '80px 24px 40px', background: 'radial-gradient(ellipse at 30% 30%, rgba(245,166,35,0.06),transparent 60%)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Join JCOM</h2>
            <p>Fill in the details below to submit your membership application</p>
          </div>

          <div className="register-stepper">
            {STEPS.map((stepLabel, index) => (
              <div key={stepLabel} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {index > 0 && <div style={{ flex: 1, height: 2, background: index <= step ? 'var(--primary)' : 'var(--border)' }} />}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: index < step ? 'var(--success)' : index === step ? 'var(--primary)' : 'var(--bg-elevated)',
                      border: `2px solid ${index <= step ? (index < step ? 'var(--success)' : 'var(--primary)') : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: index <= step ? '#000' : 'var(--text-muted)'
                    }}
                  >
                    {index < step ? <CheckCircleOutlined /> : index + 1}
                  </div>
                  {index < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: index < step ? 'var(--primary)' : 'var(--border)' }} />}
                </div>
                <div className="register-step-label" style={{ color: index === step ? 'var(--primary)' : 'var(--text-muted)', fontWeight: index === step ? 700 : 400 }}>
                  <span className="hide-xs">{stepLabel}</span>
                  <span className="show-xs">{MOBILE_STEPS[index]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card-gold animate-fadeInUp" style={{ padding: 32 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Step {step + 1}: {STEPS[step]}</h4>
            {stepContent[step]}

            {error && (
              <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--error)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap' }}>
              {step > 0 && (
                <button onClick={() => setStep((current) => current - 1)} className="btn btn-ghost" style={{ gap: 8 }}>
                  <ArrowLeftOutlined /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={() => { if (validateStep()) setStep((current) => current + 1); }} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                  Next Step →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="btn btn-primary btn-lg" style={{ marginLeft: 'auto' }}>
                  {loading ? <Loader size={22} color="#ffffff" inline label="Submitting..." /> : 'Submit Application'}
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
