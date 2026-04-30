import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarOutlined, ClockCircleOutlined, DeleteOutlined, EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, buildAssetUrl } from '../config/api';

const EventsPage = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const canManageEvents = isAuthenticated && ['Super Admin', 'Chairman'].includes(user?.role);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    poster: null
  });

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/events?scope=all`);
      setEvents(res.data.events || []);
    } catch (err) {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      eventDate: '',
      eventTime: '',
      venue: '',
      poster: null
    });
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('eventDate', form.eventDate);
      payload.append('eventTime', form.eventTime);
      payload.append('venue', form.venue);
      if (form.poster) payload.append('poster', form.poster);

      await axios.post(`${API_BASE_URL}/events`, payload, {
        headers: {
          ...authHeaders,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Event posted successfully.');
      setShowForm(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to post event right now.');
    }

    setSaving(false);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`${API_BASE_URL}/events/${eventId}`, {
        headers: authHeaders
      });
      setEvents((current) => current.filter((item) => item._id !== eventId));
      setMessage('Event removed successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to delete this event.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      <div className="page-shell">
        <section className="glass-card" style={{ padding: '32px clamp(20px, 4vw, 44px)', marginBottom: 24 }}>
          <div className="responsive-split" style={{ alignItems: 'start' }}>
            <div>
              <div className="badge badge-gold" style={{ marginBottom: 14 }}>Events & Chapters</div>
              <h1 style={{ marginBottom: 12 }}>
                Follow the latest <span className="highlight-gold">JCOM events</span> and chapter activities
              </h1>
              <p style={{ maxWidth: 760 }}>
                This page highlights upcoming and recently posted chapter events. Super Admin and Chairman users can publish event posters here so members and visitors can see what is being conducted.
              </p>
            </div>

            {canManageEvents && (
              <div className="glass-card-teal" style={{ padding: 18 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Post Event Updates</div>
                <p style={{ fontSize: '0.88rem', marginBottom: 14 }}>
                  Share your event title, venue, date, and poster so members can stay informed.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setShowForm((open) => !open)}>
                  <PlusOutlined /> {showForm ? 'Hide Form' : 'Create Event'}
                </button>
              </div>
            )}
          </div>
        </section>

        {message && (
          <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 12, background: message.toLowerCase().includes('unable') ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)', color: message.toLowerCase().includes('unable') ? 'var(--error)' : 'var(--success)', border: `1px solid ${message.toLowerCase().includes('unable') ? 'rgba(220,38,38,0.22)' : 'rgba(22,163,74,0.22)'}`, fontWeight: 600 }}>
            {message}
          </div>
        )}

        {canManageEvents && showForm && (
          <section className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Post New Event</h3>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="responsive-two-col" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Event Title</label>
                  <input className="form-input" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="JCOM Krishnagiri Business Meet" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input className="form-input" value={form.venue} onChange={(e) => setField('venue', e.target.value)} placeholder="Hotel / Hall / Meeting space" required />
                </div>
              </div>

              <div className="responsive-two-col" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input className="form-input" type="date" value={form.eventDate} onChange={(e) => setField('eventDate', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Time</label>
                  <input className="form-input" type="text" value={form.eventTime} onChange={(e) => setField('eventTime', e.target.value)} placeholder="10:00 AM to 1:00 PM" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What is the event about, who should attend, and what will happen there?" required />
              </div>

              <div className="form-group">
                <label className="form-label">Poster Image</label>
                <input className="form-input" type="file" accept="image/*" onChange={(e) => setField('poster', e.target.files?.[0] || null)} />
              </div>

              <div className="responsive-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Posting...' : 'Publish Event'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => { resetForm(); setShowForm(false); }}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="grid-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="skeleton" style={{ height: 360, borderRadius: 18 }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 50 }}>
            <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>Calendar</div>
            <h3 style={{ marginBottom: 10 }}>No events posted yet</h3>
            <p style={{ margin: 0 }}>When chapter leaders publish event posters, they will appear here.</p>
          </div>
        ) : (
          <div className="grid-3">
            {events.map((item) => {
              const canDelete = canManageEvents && (user?.role === 'Super Admin' || String(user?._id) === String(item.createdBy));

              return (
                <article key={item._id} className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ height: 210, background: 'linear-gradient(135deg, rgba(0,73,194,0.08), rgba(0,184,148,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {item.poster ? (
                      <img src={buildAssetUrl(item.poster)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)', padding: 18, textAlign: 'center' }}>
                        {item.title}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 10 }}>
                      <div>
                        <div className="badge badge-teal" style={{ marginBottom: 10 }}>
                          {(item.organizerRole || 'JCOM Event').toUpperCase()}
                        </div>
                        <h3 style={{ marginBottom: 8 }}>{item.title}</h3>
                      </div>
                      {canDelete && (
                        <button type="button" onClick={() => handleDeleteEvent(item._id)} style={{ border: '1px solid rgba(220,38,38,0.18)', background: 'rgba(220,38,38,0.06)', color: 'var(--error)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', flexShrink: 0 }}>
                          <DeleteOutlined />
                        </button>
                      )}
                    </div>

                    <p style={{ marginBottom: 16, fontSize: '0.9rem' }}>{item.description}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <CalendarOutlined style={{ color: 'var(--primary)' }} />
                        <span>{new Date(item.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      {item.eventTime && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          <ClockCircleOutlined style={{ color: 'var(--primary)' }} />
                          <span>{item.eventTime}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <EnvironmentOutlined style={{ color: 'var(--primary)' }} />
                        <span>{item.venue}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Posted by {item.organizerName || 'JCOM'}{item.locationName ? ` · ${item.locationName}` : ''}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
