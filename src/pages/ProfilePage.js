import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CopyOutlined } from '@ant-design/icons';
import SidebarLayout from '../components/SidebarLayout';
import ProfileAvatar from '../components/ProfileAvatar';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const ProfilePage = () => {
  const { userId } = useParams();
  const { user, token, login } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    businessService: '',
    businessDescription: '',
    businessWebsite: '',
    profilePic: null
  });
  const hasLegacyMissingPhoto = typeof profile?.profilePic === 'string' && profile.profilePic.startsWith('/uploads/');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token || localStorage.getItem('token')}` };
        const res = await axios.get(`${API}/users/profile/${userId || user?._id}`, { headers });
        const nextUser = res.data.user;
        setProfile(nextUser);
        setForm({
          firstName: nextUser.firstName || '',
          lastName: nextUser.lastName || '',
          phone: nextUser.phone || '',
          businessName: nextUser.businessName || '',
          businessService: nextUser.businessService || '',
          businessDescription: nextUser.businessDescription || '',
          businessWebsite: nextUser.businessWebsite || '',
          profilePic: null
        });
        setPreviewUrl(nextUser.profilePic || '');
      } catch (err) {
        setMessage(err.response?.data?.message || 'Unable to load profile');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [token, user?._id, userId]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setField('profilePic', file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const headers = { Authorization: `Bearer ${token || localStorage.getItem('token')}` };
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value && key !== 'profilePic') data.append(key, value);
      });
      if (form.profilePic) data.append('profilePic', form.profilePic);

      const res = await axios.put(`${API}/users/profile`, data, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = res.data.user;
      setProfile(updatedUser);
      setPreviewUrl(updatedUser.profilePic || '');
      setField('profilePic', null);
      setMessage('Profile updated successfully');

      if (user && updatedUser._id === user._id) {
        const mergedUser = {
          ...user,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          businessName: updatedUser.businessName,
          businessService: updatedUser.businessService,
          businessDescription: updatedUser.businessDescription,
          businessWebsite: updatedUser.businessWebsite,
          profilePic: updatedUser.profilePic,
          slug: updatedUser.slug
        };
        login(token || localStorage.getItem('token'), mergedUser);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
    }

    setSaving(false);
  };

  const copyPublicProfileLink = async () => {
    if (!profile?.slug) return;

    try {
      const shareLink = `${window.location.origin}/${profile.slug}`;
      await navigator.clipboard.writeText(shareLink);
      setShareMessage('Public profile link copied');
    } catch (err) {
      setShareMessage('Unable to copy profile link');
    }

    window.setTimeout(() => setShareMessage(''), 2000);
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div style={{ padding: '80px 24px 40px', maxWidth: 900, margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: 28 }}>
            <Loader label="Loading profile" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div style={{ padding: '80px 24px 40px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>My Profile</h2>
          <p>Update your business details and re-upload your profile photo if it is missing.</p>
        </div>

        {message && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 10,
              background: message.toLowerCase().includes('success') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${message.toLowerCase().includes('success') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: message.toLowerCase().includes('success') ? 'var(--success)' : 'var(--error)'
            }}
          >
            {message}
          </div>
        )}

        {shareMessage && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(39,162,222,0.08)',
              border: '1px solid rgba(39,162,222,0.18)',
              color: 'var(--primary)'
            }}
          >
            {shareMessage}
          </div>
        )}

        {hasLegacyMissingPhoto && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#b45309'
            }}
          >
            Your old profile image is stored as a legacy upload path and may not exist on the deployed server anymore. Click the avatar below to upload it again.
          </div>
        )}

        <form className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <label htmlFor="profilePicInput" style={{ cursor: 'pointer' }}>
              <ProfileAvatar
                src={previewUrl}
                firstName={form.firstName || profile?.firstName}
                lastName={form.lastName || profile?.lastName}
                alt="Profile"
                size={96}
                borderRadius="50%"
                fontSize={32}
                border="3px solid var(--border-accent)"
              />
            </label>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                {profile?.membershipId || 'Pending Membership'}
              </div>
              <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                Click the photo to upload a new profile image.
              </div>
              {profile?.slug && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Public URL: <strong style={{ color: 'var(--primary)' }}>{window.location.origin}/{profile.slug}</strong>
                  </span>
                  <button type="button" className="btn btn-outline btn-sm" onClick={copyPublicProfileLink}>
                    <CopyOutlined /> Copy Link
                  </button>
                </div>
              )}
              <input id="profilePicInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" value={form.businessName} onChange={(e) => setField('businessName', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Business Service</label>
            <textarea className="form-textarea" rows={3} value={form.businessService} onChange={(e) => setField('businessService', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Business Description</label>
            <textarea className="form-textarea" rows={4} value={form.businessDescription} onChange={(e) => setField('businessDescription', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Business Website</label>
            <input className="form-input" value={form.businessWebsite} onChange={(e) => setField('businessWebsite', e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
};

export default ProfilePage;
