import React, { useState, useEffect, useRef, useContext } from 'react';
import { Modal, Input } from 'antd';
import { SendOutlined, CheckCircleOutlined, DollarOutlined, CloseOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const ChatModal = ({ open, onClose, connection, otherUser }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [step, setStep] = useState('chat'); // 'chat' | 'service_request' | 'convert' | 'amount'
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMessages([
        {
          id: 1, from: 'system',
          text: `You are now connected with ${otherUser?.firstName}. Start a conversation to explore business opportunities!`,
          time: new Date()
        }
      ]);
      setStep('chat');
    }
  }, [open, otherUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const msg = { id: Date.now(), from: 'me', text: text.trim(), time: new Date() };
    setMessages(prev => [...prev, msg]);
    setText('');
  };

  const sendServiceRequest = () => {
    setMessages(prev => [...prev, {
      id: Date.now(), from: 'me',
      text: `🤝 I need your service: "${otherUser?.businessService || otherUser?.businessName}"`,
      type: 'request', time: new Date()
    }]);
    setStep('waiting_accept');
    // Simulate acceptance
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(), from: 'other',
        text: `✅ ${otherUser?.firstName} accepted your service request! You can now convert this to a deal.`,
        type: 'accept', time: new Date()
      }]);
      setStep('convert');
    }, 1500);
  };

  const convertToDeal = () => setStep('amount');

  const handleConvert = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/deals`, {
        connectionId: connection?._id,
        amount: Number(amount),
        description: `Deal with ${otherUser?.firstName} ${otherUser?.lastName}`
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessages(prev => [...prev, {
        id: Date.now(), from: 'system',
        text: `🎉 Deal created for ₹${Number(amount).toLocaleString('en-IN')}! Awaiting confirmation from ${otherUser?.firstName}.`,
        type: 'deal', time: new Date()
      }]);
      setStep('deal_done');
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), from: 'system', text: '❌ Failed to create deal. Try again.', time: new Date() }]);
    }
    setLoading(false);
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      title={null}
      closeIcon={false}
      styles={{ content: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 0 }, mask: { background: 'rgba(0,0,0,0.8)' } }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grad-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000' }}>
          {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{otherUser?.firstName} {otherUser?.lastName}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>{otherUser?.businessCategory} · {otherUser?.locationName}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-success">Connected</span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: '0.75rem', lineHeight: 1,
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ height: 300, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : msg.from === 'system' ? 'center' : 'flex-start' }}>
            {msg.from === 'system' ? (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 20, padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '85%', textAlign: 'center', border: '1px solid var(--border)' }}>
                {msg.text}
              </div>
            ) : (
              <div style={{
                maxWidth: '75%', padding: '10px 14px',
                borderRadius: msg.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.from === 'me' ? 'var(--grad-gold)' : 'var(--bg-elevated)',
                color: msg.from === 'me' ? '#000' : 'var(--text-primary)',
                fontSize: '0.88rem', border: msg.from !== 'me' ? '1px solid var(--border)' : 'none'
              }}>
                {msg.text}
                <div style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: 4, textAlign: 'right' }}>{formatTime(msg.time)}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '0 20px 8px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {step === 'chat' && (
          <button onClick={sendServiceRequest} className="btn btn-teal btn-sm" style={{ fontSize: '0.78rem' }}>
            🤝 I Need Your Service
          </button>
        )}
        {step === 'convert' && (
          <button onClick={convertToDeal} className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
            <DollarOutlined /> Convert to Deal
          </button>
        )}
        {step === 'amount' && (
          <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
            <input
              type="number" placeholder="Enter amount (₹)" value={amount}
              onChange={e => setAmount(e.target.value)}
              className="form-input" style={{ flex: 1, padding: '8px 12px' }}
            />
            <button onClick={handleConvert} disabled={loading} className="btn btn-primary btn-sm">
              <CheckCircleOutlined /> Confirm
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      {(step === 'chat' || step === 'convert' || step === 'waiting_accept') && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            className="form-input" placeholder="Type a message..."
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1, padding: '10px 14px' }}
          />
          <button onClick={sendMessage} className="btn btn-primary btn-sm" style={{ padding: '10px 16px' }}>
            <SendOutlined />
          </button>
        </div>
      )}
    </Modal>
  );
};

export default ChatModal;
