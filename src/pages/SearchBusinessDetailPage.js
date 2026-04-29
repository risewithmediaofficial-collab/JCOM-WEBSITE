import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import { EnvironmentOutlined, GlobalOutlined, MailOutlined, PhoneOutlined, SearchOutlined } from '@ant-design/icons';

const API = 'http://localhost:5000/api';

const getInitials = (member) => `${member?.firstName?.[0] || ''}${member?.lastName?.[0] || ''}`;

const infoCardStyle = {
  padding: '16px 18px',
  borderRadius: 16,
  background: '#f8faff',
  border: '1px solid var(--border)'
};

const SearchBusinessDetailPage = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquirySaving, setEnquirySaving] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    businessName: '',
    businessCategory: '',
    requirement: ''
  });

  const query = searchParams.get('q') || '';
  const location = searchParams.get('location') || '';

  useEffect(() => {
    const fetchMember = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API}/users/public/${userId}`);
        setMember(res.data.member || null);
      } catch (err) {
        setMember(null);
        setError(err.response?.data?.message || 'Unable to load business information');
      }
      setLoading(false);
    };

    fetchMember();
  }, [userId]);

  const breadcrumbs = useMemo(() => {
    const searchUrl = `/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    const items = [
      { label: 'Home', to: '/' },
      { label: 'Search', to: searchUrl }
    ];

    if (location) {
      items.push({ label: location, to: `/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}` });
    }

    if (member) {
      items.push({ label: `${member.firstName} ${member.lastName}` });
    } else {
      items.push({ label: 'Business Detail' });
    }

    return items;
  }, [location, member, query]);

  const submitEnquiry = async () => {
    if (!enquiryForm.name.trim() || !enquiryForm.phone.trim() || !enquiryForm.location.trim() || !enquiryForm.requirement.trim()) {
      setEnquiryMessage('Please fill name, phone, location, and requirement');
      return;
    }

    setEnquirySaving(true);
    setEnquiryMessage('');
    try {
      await axios.post(`${API}/crm/public-enquiry/${userId}`, enquiryForm);
      setEnquiryMessage('Enquiry sent successfully');
      setEnquiryForm({
        name: '',
        phone: '',
        email: '',
        location: '',
        businessName: '',
        businessCategory: '',
        requirement: ''
      });
      setTimeout(() => {
        setShowEnquiry(false);
        setEnquiryMessage('');
      }, 1200);
    } catch (err) {
      setEnquiryMessage(err.response?.data?.message || 'Unable to send enquiry');
    }
    setEnquirySaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      <div style={{ padding: '80px 24px 40px', maxWidth: 1240, margin: '0 auto' }}>
        <Breadcrumbs items={breadcrumbs} />

        {loading && (
          <div className="glass-card" style={{ padding: 28 }}>
            <div className="skeleton" style={{ height: 28, width: 240, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 18, width: '65%', marginBottom: 24 }} />
            <div className="grid-2">
              <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
              <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="glass-card" style={{ padding: 34, textAlign: 'center' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>Search</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Business information not available</h3>
            <p style={{ marginBottom: 20 }}>{error}</p>
            <Link to={query ? `/search?q=${encodeURIComponent(query)}` : '/search'} className="btn btn-primary">
              <SearchOutlined /> Back to Search
            </Link>
          </div>
        )}

        {!loading && member && (
          <>
            <div className="glass-card" style={{ padding: '28px clamp(20px, 3vw, 34px)', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.9fr)', gap: 24, alignItems: 'center' }}>
                <div>
                  <div className="badge badge-gold" style={{ marginBottom: 12 }}>Business Listing</div>
                  <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.02, marginBottom: 10 }}>
                    {member.businessName || `${member.firstName} ${member.lastName}`}
                  </h1>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>
                    {member.firstName} {member.lastName}
                  </div>
                  <p style={{ maxWidth: 740, marginBottom: 18 }}>
                    {member.businessDescription || member.businessService || 'Verified JCOM business member profile with service, contact, and location details.'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                    <span className="badge badge-gold">{member.businessCategory || 'Business Category'}</span>
                    <span className="badge badge-teal">{member.locationName || 'Location not added'}</span>
                    <span className="badge badge-info">{member.tableName || 'JCOM Member'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setShowEnquiry(true)} className="btn btn-primary">Enquiry</button>
                    <Link to="/login" className="btn btn-outline">Connect</Link>
                    {member.businessWebsite && (
                      <a href={member.businessWebsite} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                        <GlobalOutlined /> Visit Website
                      </a>
                    )}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: 22, background: '#fbfcff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                    <div className="avatar avatar-xl">
                      {member.profilePic ? (
                        <img src={`http://localhost:5000${member.profilePic}`} alt={`${member.firstName} ${member.lastName}`} />
                      ) : (
                        getInitials(member)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {member.firstName} {member.lastName}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {member.membershipId || 'Membership ID not available'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={infoCardStyle}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                        Contact
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}><PhoneOutlined /> {member.phone || 'Not available'}</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}><MailOutlined /> {member.email || 'Not available'}</div>
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                        Location
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}><EnvironmentOutlined /> {member.locationName || 'Not available'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.95fr)', gap: 20 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 16 }}>Business Details</h3>
                <div className="connection-info-grid" style={{ marginBottom: 18 }}>
                  {[
                    ['Business Name', member.businessName || 'Not available'],
                    ['Business Category', member.businessCategory || 'Not available'],
                    ['Service', member.businessService || 'Not available'],
                    ['Membership ID', member.membershipId || 'Not available'],
                    ['Table', member.tableName || 'Not available'],
                    ['Location', member.locationName || 'Not available']
                  ].map(([label, value]) => (
                    <div key={label} style={infoCardStyle}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                        {label}
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <h4 style={{ marginBottom: 10, color: 'var(--text-primary)' }}>About This Business</h4>
                <p style={{ marginBottom: 18 }}>
                  {member.businessDescription || 'No detailed business description added yet.'}
                </p>

                {member.keywords?.length > 0 && (
                  <>
                    <h4 style={{ marginBottom: 10, color: 'var(--text-primary)' }}>Keywords</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {member.keywords.map((keyword, index) => (
                        <span key={`${keyword}-${index}`} style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid var(--border-teal)', borderRadius: 20, padding: '4px 10px', fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 600 }}>
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                  <h3 style={{ marginBottom: 16 }}>Contact Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={infoCardStyle}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                        Phone Number
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{member.phone || 'Not available'}</div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                        Email Address
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{member.email || 'Not available'}</div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                        Website
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{member.businessWebsite || 'Not available'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showEnquiry && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(9,16,35,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card modal-sheet animate-fadeInUp" style={{ maxWidth: 620, width: '100%', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Send Enquiry</h3>
                <p style={{ margin: 0 }}>Share your requirement with {member?.firstName} {member?.lastName}. This will appear in their dashboard and CRM.</p>
              </div>
              <button onClick={() => setShowEnquiry(false)} className="btn btn-ghost btn-sm">Close</button>
            </div>

            {enquiryMessage && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: enquiryMessage.includes('successfully') ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${enquiryMessage.includes('successfully') ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.2)'}`, color: enquiryMessage.includes('successfully') ? 'var(--success)' : 'var(--error)', fontSize: '0.86rem', fontWeight: 600 }}>
                {enquiryMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input className="form-input" value={enquiryForm.name} onChange={(e) => setEnquiryForm((form) => ({ ...form, name: e.target.value }))} placeholder="Enter your name" />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" value={enquiryForm.phone} onChange={(e) => setEnquiryForm((form) => ({ ...form, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={enquiryForm.email} onChange={(e) => setEnquiryForm((form) => ({ ...form, email: e.target.value }))} placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <input className="form-input" value={enquiryForm.location} onChange={(e) => setEnquiryForm((form) => ({ ...form, location: e.target.value }))} placeholder="Your city / location" />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input className="form-input" value={enquiryForm.businessName} onChange={(e) => setEnquiryForm((form) => ({ ...form, businessName: e.target.value }))} placeholder="Your company name" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Business Category</label>
                <input className="form-input" value={enquiryForm.businessCategory} onChange={(e) => setEnquiryForm((form) => ({ ...form, businessCategory: e.target.value }))} placeholder="Your business category" />
              </div>
              <div className="form-group">
                <label className="form-label">Requirement *</label>
                <textarea className="form-textarea" rows={4} value={enquiryForm.requirement} onChange={(e) => setEnquiryForm((form) => ({ ...form, requirement: e.target.value }))} placeholder="Describe what you need, service details, quantity, budget, timeline..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              <button onClick={() => setShowEnquiry(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={submitEnquiry} disabled={enquirySaving} className="btn btn-primary" style={{ flex: 1 }}>
                {enquirySaving ? 'Sending...' : 'Send Enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBusinessDetailPage;
