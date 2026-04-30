import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import SidebarLayout from '../components/SidebarLayout';
import MemberCard from '../components/MemberCard';
import ChatModal from '../components/ChatModal';
import ProfileAvatar from '../components/ProfileAvatar';
import {
  SearchOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  SendOutlined
} from '@ant-design/icons';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;
const REQUEST_TYPES = ['NA', 'Self', 'JCOM member', 'Non member'];

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const MemberInfoDialog = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(9,16,35,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass-card modal-sheet animate-fadeInUp" style={{ maxWidth: 760, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Business Information</h3>
            <p>Member details in a Justdial-style view.</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
        </div>

        <div className="glass-card" style={{ padding: 20, marginBottom: 18, background: '#fbfcff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <ProfileAvatar
              src={member.profilePic}
              firstName={member.firstName}
              lastName={member.lastName}
              alt={`${member.firstName} ${member.lastName}`}
              size={64}
              borderRadius="50%"
              fontSize={22}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {member.firstName} {member.lastName}
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 4 }}>
                {member.businessName || 'Business not added'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: 4 }}>
                {member.businessCategory || 'Category not added'} • {member.tableName || 'No table'} • {member.locationName || 'No location'}
              </div>
            </div>
          </div>
        </div>

        <div className="connection-info-grid">
          {[
            ['Membership ID', member.membershipId || 'Not available'],
            ['Phone', member.phone || 'Not available'],
            ['Email', member.email || 'Not available'],
            ['Website', member.businessWebsite || 'Not available'],
            ['Business Category', member.businessCategory || 'Not available'],
            ['Table', member.tableName || 'Not available'],
            ['Location', member.locationName || 'Not available'],
            ['Total Connections', member.totalConnections ?? 0],
            ['Total Revenue', `Rs. ${(member.totalRevenue || 0).toLocaleString('en-IN')}`]
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '14px 16px', borderRadius: 14, background: '#f8faff', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 18, marginTop: 18 }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
            Contact Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Phone: {member.phone || 'Not available'}</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Email: {member.email || 'Not available'}</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Website: {member.businessWebsite || 'Not available'}</div>
          </div>

          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
            Business Service
          </div>
          <p style={{ marginBottom: 14 }}>{member.businessService || 'No business service added'}</p>

          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
            About Business
          </div>
          <p style={{ marginBottom: 14 }}>{member.businessDescription || 'No business description added'}</p>

          {member.businessWebsite && (
            <a href={member.businessWebsite} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
              Open Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const ConnectDialog = ({ member, user, form, setForm, error, requesting, onClose, onSubmit }) => {
  if (!member) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(9,16,35,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass-card modal-sheet animate-fadeInUp" style={{ maxWidth: 640, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>New Connect</h3>
            <p>Send a connection request to {member.firstName} {member.lastName}.</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
        </div>

        <div className="glass-card" style={{ padding: 18, marginBottom: 18, background: '#fbfcff' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d29d17', fontWeight: 700, marginBottom: 8 }}>
            Your Current Table
          </div>
          <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800 }}>
            {user?.tableName || 'No table assigned'}
          </div>
        </div>

        <div style={{ fontSize: '0.9rem', color: '#00a0dc', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          Connect Details
        </div>

        <div className="connect-form-grid">
          <div className="form-group">
            <label className="form-label">Select the table</label>
            <input className="form-input" value={form.tableName} readOnly />
          </div>

          <div className="form-group">
            <label className="form-label">Select the member</label>
            <input className="form-input" value={`${member.firstName} ${member.lastName}`} readOnly />
          </div>

          <div className="form-group">
            <label className="form-label">Select the category</label>
            <input className="form-input" value={form.category} readOnly />
          </div>

          <div className="form-group">
            <label className="form-label">Select the type</label>
            <select className="form-select" value={form.requestType} onChange={(e) => setForm((prev) => ({ ...prev, requestType: e.target.value }))}>
              {REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Service needed</label>
            <input className="form-input" value={form.serviceNeeded} onChange={(e) => setForm((prev) => ({ ...prev, serviceNeeded: e.target.value }))} placeholder="Example: Website design for our business" />
          </div>

          <div className="form-group">
            <label className="form-label">Phone number</label>
            <input className="form-input" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+91 98765 43210" />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="name@business.com" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Business details</label>
            <textarea className="form-textarea" rows={3} value={form.businessDetails} onChange={(e) => setForm((prev) => ({ ...prev, businessDetails: e.target.value }))} placeholder="Add the full requirement details" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Message</label>
            <textarea className="form-textarea" rows={2} value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} placeholder="Optional personal message" />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={onSubmit} disabled={requesting} className="btn btn-primary" style={{ flex: 1 }}>
            <SendOutlined /> {requesting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConnectionInfoDialog = ({ connection, user, onClose }) => {
  if (!connection) return null;
  const other = connection.fromUser?._id === user?._id ? connection.toUser : connection.fromUser;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(9,16,35,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass-card modal-sheet animate-fadeInUp" style={{ maxWidth: 700, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Connection Info</h3>
            <p>Full request and business details for this connection.</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
        </div>

        <div className="glass-card" style={{ padding: 20, marginBottom: 18, background: '#fbfcff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <ProfileAvatar
              src={other?.profilePic}
              firstName={other?.firstName}
              lastName={other?.lastName}
              alt={`${other?.firstName || ''} ${other?.lastName || ''}`}
              size={64}
              borderRadius="50%"
              fontSize={22}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                {other?.firstName} {other?.lastName}
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 4 }}>
                {other?.businessName || 'Business not added'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                {other?.businessCategory || 'Category not added'} • {other?.tableName || 'No table'} • {other?.locationName || 'No location'}
              </div>
            </div>
          </div>
        </div>

        <div className="connection-info-grid">
          {[
            ['Requested Date', formatDate(connection.createdAt)],
            ['Membership ID', other?.membershipId || 'Not available'],
            ['Business Category', connection.requesterDetails?.category || other?.businessCategory || 'Not available'],
            ['Request Type', connection.requesterDetails?.requestType || 'NA'],
            ['Table', connection.requesterDetails?.tableName || other?.tableName || 'Not available'],
            ['Requested Member', connection.requesterDetails?.memberName || `${other?.firstName || ''} ${other?.lastName || ''}`.trim()],
            ['Phone', connection.requesterDetails?.phone || other?.phone || 'Not available'],
            ['Email', connection.requesterDetails?.email || other?.email || 'Not available'],
            ['Website', other?.businessWebsite || 'Not available'],
            ['Total Connections', other?.totalConnections ?? 0],
            ['Total Revenue', `Rs. ${(other?.totalRevenue || 0).toLocaleString('en-IN')}`]
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '14px 16px', borderRadius: 14, background: '#f8faff', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 18, marginTop: 18 }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
            Contact Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Phone: {connection.requesterDetails?.phone || other?.phone || 'Not available'}</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Email: {connection.requesterDetails?.email || other?.email || 'Not available'}</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Website: {other?.businessWebsite || 'Not available'}</div>
          </div>

          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
            Service Needed
          </div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 10 }}>
            {connection.requesterDetails?.serviceNeeded || connection.requestMessage || 'No service details added'}
          </div>

          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
            Business Details
          </div>
          <p style={{ marginBottom: 12 }}>
            {connection.requesterDetails?.businessDetails || other?.businessDescription || 'No business details added'}
          </p>

          {other?.businessService && (
            <>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
                Business Service
              </div>
              <p style={{ marginBottom: 12 }}>{other.businessService}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ConnectionsPage = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('table');
  const [members, setMembers] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConn, setChatConn] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [memberInfoModal, setMemberInfoModal] = useState(null);
  const [connectionInfoModal, setConnectionInfoModal] = useState(null);
  const [connectModal, setConnectModal] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [formError, setFormError] = useState('');
  const [requestForm, setRequestForm] = useState({
    tableName: '',
    category: '',
    requestType: 'NA',
    serviceNeeded: '',
    phone: '',
    email: '',
    businessDetails: '',
    message: ''
  });
  const [convertModal, setConvertModal] = useState(null);
  const [convertAmount, setConvertAmount] = useState('');
  const [convertNotes, setConvertNotes] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertMsg, setConvertMsg] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    const requestHeaders = { Authorization: `Bearer ${token}` };
    setLoading(true);
    try {
      if (tab === 'table') {
        const [membersRes, connRes] = await Promise.all([
          axios.get(`${API}/users/by-table`, { headers: requestHeaders }),
          axios.get(`${API}/connections/my`, { headers: requestHeaders })
        ]);
        setMembers(membersRes.data.members || []);
        setMyConnections(connRes.data.connections || []);
      } else {
        const type = tab === 'given' ? 'given' : 'received';
        const res = await axios.get(`${API}/connections/my?type=${type}`, { headers: requestHeaders });
        setMyConnections(res.data.connections || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [tab, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getConnectionStatus = (memberId) => {
    const conn = myConnections.find(
      (connection) => connection.fromUser?._id === memberId || connection.toUser?._id === memberId
    );
    if (!conn) return { status: null, connection: null };
    return { status: conn.status, connection: conn };
  };

  const openConnectModal = (member) => {
    setFormError('');
    setConnectModal(member);
    setRequestForm({
      tableName: user?.tableName || '',
      category: member.businessCategory || '',
      requestType: 'NA',
      serviceNeeded: '',
      phone: user?.phone || '',
      email: user?.email || '',
      businessDetails: '',
      message: ''
    });
  };

  const handleSendRequest = async () => {
    if (!connectModal) return;
    if (!requestForm.serviceNeeded.trim()) {
      setFormError('Please enter the service needed');
      return;
    }

    setRequesting(true);
    setFormError('');
    try {
      await axios.post(
        `${API}/connections/request`,
        {
          toUserId: connectModal._id,
          tableName: requestForm.tableName || user?.tableName || '',
          memberName: `${connectModal.firstName} ${connectModal.lastName}`,
          category: requestForm.category || connectModal.businessCategory || '',
          requestType: requestForm.requestType || 'NA',
          serviceNeeded: requestForm.serviceNeeded.trim(),
          phone: requestForm.phone.trim(),
          email: requestForm.email.trim(),
          businessDetails: requestForm.businessDetails.trim(),
          message:
            requestForm.message.trim() ||
            `Hi ${connectModal.firstName}, I need ${requestForm.serviceNeeded.trim()}`
        },
        { headers }
      );

      setConnectModal(null);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to send request');
    }
    setRequesting(false);
  };

  const handleOpenChat = (conn) => {
    const other = conn.fromUser?._id === user?._id ? conn.toUser : conn.fromUser;
    setChatConn(conn);
    setChatUser(other);
    setChatOpen(true);
  };

  const handleAccept = async (connId) => {
    try {
      await axios.patch(`${API}/connections/accept/${connId}`, {}, { headers });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleCancel = async (connId) => {
    if (!window.confirm('Cancel this connection request?')) return;
    try {
      await axios.patch(`${API}/connections/cancel/${connId}`, {}, { headers });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleConvertRevenue = async () => {
    if (!convertModal) return;
    if (!convertAmount || Number.isNaN(Number(convertAmount)) || Number(convertAmount) <= 0) {
      setConvertMsg('Please enter a valid amount');
      return;
    }

    setConverting(true);
    setConvertMsg('');
    try {
      await axios.patch(
        `${API}/connections/convert/${convertModal._id}`,
        { amount: Number(convertAmount), notes: convertNotes },
        { headers }
      );
      setConvertMsg(`Revenue of Rs. ${Number(convertAmount).toLocaleString('en-IN')} recorded`);
      setTimeout(() => {
        setConvertModal(null);
        setConvertAmount('');
        setConvertNotes('');
        setConvertMsg('');
        fetchData();
      }, 1400);
    } catch (err) {
      setConvertMsg(err.response?.data?.message || 'Failed to convert');
    }
    setConverting(false);
  };

  const filteredMembers = members.filter((member) =>
    `${member.firstName} ${member.lastName} ${member.businessName} ${member.businessCategory}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div style={{ padding: 'clamp(16px, 3vw, 32px) clamp(12px, 3vw, 28px) 40px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Connections</h2>
          <p>Browse table members, open business information, and connect from the popup dialog.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'table', label: 'My Table Members' },
            { key: 'given', label: 'Given Requests' },
            { key: 'received', label: 'Received Requests' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`btn btn-sm ${tab === item.key ? 'btn-primary' : 'btn-ghost'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'table' && (
          <>
            <div style={{ position: 'relative', maxWidth: 420, marginBottom: 20 }}>
              <SearchOutlined style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder="Search members in your table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>

            {loading ? (
              <div className="grid-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="skeleton" style={{ height: 220, borderRadius: 16 }} />
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 56 }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No Members Found</h4>
                <p>Your table members will appear here once approved by the chairman.</p>
              </div>
            ) : (
              <div className="grid-3">
                {filteredMembers
                  .filter((member) => member._id !== user?._id)
                  .map((member) => {
                    const { status } = getConnectionStatus(member._id);
                    return (
                      <MemberCard
                        key={member._id}
                        member={member}
                        onInfo={setMemberInfoModal}
                        onConnect={status || status === 'Disconnected' ? (status === 'Disconnected' ? openConnectModal : null) : openConnectModal}
                        isConnected={status === 'Connected'}
                        isPending={status === 'Requested'}
                      />
                    );
                  })}
              </div>
            )}
          </>
        )}

        {(tab === 'given' || tab === 'received') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loading ? (
              [1, 2, 3].map((item) => <div key={item} className="skeleton" style={{ height: 138, borderRadius: 18 }} />)
            ) : myConnections.filter((connection) => connection.status !== 'Disconnected').length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 56 }}>
                <h4 style={{ color: 'var(--text-primary)' }}>No {tab === 'given' ? 'sent' : 'received'} requests yet</h4>
                <p>Start connecting with members in your table.</p>
              </div>
            ) : (
              myConnections
                .filter((connection) => connection.status !== 'Disconnected')
                .map((conn) => {
                  const other = conn.fromUser?._id === user?._id ? conn.toUser : conn.fromUser;
                  const isReceived = conn.toUser?._id === user?._id;
                  const isSender = conn.fromUser?._id === user?._id;

                  return (
                    <div key={conn._id} className="glass-card" style={{ padding: 20, borderLeft: '5px solid #2f68c5' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                        <ProfileAvatar
                          src={other?.profilePic}
                          firstName={other?.firstName}
                          lastName={other?.lastName}
                          alt={`${other?.firstName || ''} ${other?.lastName || ''}`}
                          size={58}
                          borderRadius="50%"
                          fontSize={20}
                        />

                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                              {other?.firstName} {other?.lastName}
                            </div>
                            <span className={`badge ${conn.status === 'Connected' ? 'badge-success' : 'badge-warning'}`}>
                              {conn.status}
                            </span>
                            {conn.dealCreated && <span className="badge badge-gold">Revenue Logged</span>}
                          </div>

                          <div style={{ fontSize: '0.86rem', color: 'var(--primary)', fontWeight: 700, marginBottom: 6 }}>
                            {formatDate(conn.createdAt)}
                          </div>

                          <div style={{ fontWeight: 700, color: '#d6a221', marginBottom: 4 }}>
                            {conn.requesterDetails?.category || other?.businessCategory || 'Business Category'}
                          </div>

                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            {conn.requesterDetails?.serviceNeeded || conn.requestMessage || other?.businessService || 'No request summary added'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', marginTop: 10 }}>
                          <button onClick={() => setConnectionInfoModal(conn)} className="btn btn-ghost btn-sm">
                            <InfoCircleOutlined /> Info
                          </button>

                          {isReceived && conn.status === 'Requested' && (
                            <button onClick={() => handleAccept(conn._id)} className="btn btn-teal btn-sm">
                              <CheckCircleOutlined /> Accept
                            </button>
                          )}

                          {(isSender || isReceived) && conn.status === 'Requested' && (
                            <button
                              onClick={() => handleCancel(conn._id)}
                              className="btn btn-sm"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.24)', color: 'var(--error)' }}
                            >
                              <CloseCircleOutlined /> Cancel
                            </button>
                          )}

                          {conn.status === 'Connected' && (
                            <button onClick={() => handleOpenChat(conn)} className="btn btn-primary btn-sm">
                              Chat
                            </button>
                          )}

                          {conn.status === 'Connected' && !conn.dealCreated && (
                            <button
                              onClick={() => {
                                setConvertModal(conn);
                                setConvertAmount('');
                                setConvertNotes('');
                                setConvertMsg('');
                              }}
                              className="btn btn-sm"
                              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.24)', color: '#7c3aed' }}
                            >
                              <SwapOutlined /> Convert to Revenue
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      <MemberInfoDialog member={memberInfoModal} onClose={() => setMemberInfoModal(null)} />
      <ConnectDialog
        member={connectModal}
        user={user}
        form={requestForm}
        setForm={setRequestForm}
        error={formError}
        requesting={requesting}
        onClose={() => setConnectModal(null)}
        onSubmit={handleSendRequest}
      />
      <ConnectionInfoDialog
        connection={connectionInfoModal}
        user={user}
        onClose={() => setConnectionInfoModal(null)}
      />

      {convertModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(9,16,35,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card modal-sheet animate-fadeInUp" style={{ maxWidth: 420, width: '100%', padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>💰</div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Log Revenue</h4>
              <p style={{ fontSize: '0.9rem' }}>
                Record the business completed with{' '}
                <strong style={{ color: 'var(--primary)' }}>
                  {(convertModal.fromUser?._id === user?._id ? convertModal.toUser : convertModal.fromUser)?.firstName}
                </strong>
              </p>
            </div>

            {convertMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: convertMsg.toLowerCase().includes('failed') || convertMsg.toLowerCase().includes('valid') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: convertMsg.toLowerCase().includes('failed') || convertMsg.toLowerCase().includes('valid') ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>
                {convertMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Amount paid / deal value</label>
                <input type="number" className="form-input" placeholder="50000" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={3} placeholder="What work was completed?" value={convertNotes} onChange={(e) => setConvertNotes(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setConvertModal(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleConvertRevenue} disabled={converting || !convertAmount} className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                {converting ? 'Saving...' : 'Log Revenue'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} connection={chatConn} otherUser={chatUser} />
    </SidebarLayout>
  );
};

export default ConnectionsPage;


