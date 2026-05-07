import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { EyeOutlined, EyeInvisibleOutlined, LockOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'change-password'
  const [forgotForm, setForgotForm] = useState({ identifier: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotMsg, setForgotMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      login(res.data.token, res.data.user);
      navigate(res.data.redirectTo || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotMsg('Passwords do not match'); return;
    }
    setLoading(true); setForgotMsg('');
    try {
      // First login to get token, then change password
      const loginRes = await axios.post(`${API}/auth/login`, { identifier: forgotForm.identifier, password: forgotForm.oldPassword });
      const token = loginRes.data.token;
      await axios.post(`${API}/auth/change-password`, { oldPassword: forgotForm.oldPassword, newPassword: forgotForm.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setForgotMsg('✅ Password changed successfully! Please login with your new password.');
      setTimeout(() => setMode('login'), 2000);
    } catch (err) {
      setForgotMsg(err.response?.data?.message || 'Failed. Check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 40px',
        background: 'radial-gradient(ellipse at 30% 50%, rgba(245,166,35,0.07), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(0,212,170,0.06), transparent 60%)'
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Card */}
          <div className="glass-card-gold animate-fadeInUp" style={{ padding: 40 }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 12px' }}>⚡</div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>
                {mode === 'login' ? 'Welcome Back' : 'Reset Password'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                {mode === 'login' ? 'Sign in with your Member ID or Email' : 'Set a new password using your old one'}
              </p>
            </div>

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Member ID or Email</label>
                  <div style={{ position: 'relative' }}>
                    <UserOutlined style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="login-identifier"
                      className="form-input" type="text"
                      placeholder="JCOM-KRG-2025-0001 or email"
                      value={form.identifier}
                      onChange={e => setForm({ ...form, identifier: e.target.value })}
                      style={{ paddingLeft: 40 }} required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <LockOutlined style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="login-password"
                      className="form-input" type={showPwd ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      style={{ paddingLeft: 40, paddingRight: 44 }} required
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPwd ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>

                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--error)', fontSize: '0.85rem' }}>{error}</div>}

                <button id="login-submit" type="submit" disabled={loading} className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 14 }}>
                  {loading ? <Loader size={22} color="#ffffff" inline label="Signing In..." /> : 'Sign In'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                    Forgot Password?
                  </button>
                  <Link to="/register" style={{ color: 'var(--accent)' }}>New member? Register</Link>
                </div>
              </form>
            )}

            {/* FORGOT / CHANGE PASSWORD */}
            {mode === 'forgot' && (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Member ID or Email</label>
                  <input className="form-input" type="text" placeholder="Your Member ID or email" value={forgotForm.identifier} onChange={e => setForgotForm({ ...forgotForm, identifier: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Old / Temporary Password</label>
                  <input className="form-input" type="password" placeholder="Your current/temp password" value={forgotForm.oldPassword} onChange={e => setForgotForm({ ...forgotForm, oldPassword: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" placeholder="New password (min 6 chars)" value={forgotForm.newPassword} onChange={e => setForgotForm({ ...forgotForm, newPassword: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" placeholder="Confirm new password" value={forgotForm.confirmPassword} onChange={e => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })} required />
                </div>

                {forgotMsg && (
                  <div style={{ background: forgotMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${forgotMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, padding: '10px 14px', color: forgotMsg.startsWith('✅') ? 'var(--success)' : 'var(--error)', fontSize: '0.85rem' }}>
                    {forgotMsg}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 14 }}>
                  {loading ? <Loader size={22} color="#ffffff" inline label="Changing..." /> : 'Change Password'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="btn btn-ghost w-full" style={{ justifyContent: 'center' }}>
                  <ArrowLeftOutlined /> Back to Login
                </button>
              </form>
            )}
          </div>

          {/* Super Admin hint */}
          <div style={{ textAlign: 'center', marginTop: 20, padding: '12px 16px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🔑 Super Admin default login:</div>
            <div style={{ fontSize: '0.78rem', color: '#a78bfa', marginTop: 2 }}>superadmin@jcom.in / JCOM@2026</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

