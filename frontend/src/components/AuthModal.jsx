import React, { useState } from 'react';
import { FlowerIcon } from './BrandLogo';
import { registerUser, loginUser } from '../api';
import { X, Lock, Mail, User } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp && !name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      let user;
      if (isSignUp) {
        user = await registerUser(name.trim(), email.trim(), password);
      } else {
        user = await loginUser(email.trim(), password);
      }
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(42, 37, 34, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 24px 64px rgba(42, 37, 34, 0.25)',
        border: '1px solid #EFE3DA',
        overflow: 'hidden',
        position: 'relative',
        animation: 'fadeIn 0.25s ease'
      }}>
        {/* Top Header */}
        <div style={{
          backgroundColor: '#2A2522',
          padding: '28px 24px',
          textAlign: 'center',
          color: '#FFFFFF',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#A89B92',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <FlowerIcon size={38} color="#C2693F" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            {isSignUp ? 'Create your Account' : 'Welcome to NexoraAI'}
          </h2>
          <p style={{ color: '#C7BBB2', fontSize: '13px', marginTop: '4px' }}>
            {isSignUp ? 'Join the multimodal AI chat workspace' : 'Sign in to access your chats and library'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 24px' }}>
          {error && (
            <div style={{
              backgroundColor: '#FFF0EE',
              color: '#d9534f',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #F8D7DA'
            }}>
              {error}
            </div>
          )}

          {isSignUp && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Full Name</label>
              <div style={inputContainerStyle}>
                <User size={18} color="#8D7F76" />
                <input
                  type="text"
                  placeholder="Shalika"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email Address</label>
            <div style={inputContainerStyle}>
              <Mail size={18} color="#8D7F76" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Password</label>
            <div style={inputContainerStyle}>
              <Lock size={18} color="#8D7F76" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <span style={{ fontSize: '11px', color: '#8D7F76', display: 'block', marginTop: '4px' }}>
              Minimum 8 characters (stored locally for session as permitted)
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '999px',
              backgroundColor: '#C2693F',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: '600',
              fontSize: '15px',
              cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 4px 16px rgba(194, 105, 63, 0.35)',
              transition: 'background-color 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6E6259' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#C2693F',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '12.5px',
  fontWeight: '600',
  color: '#2A2522',
  marginBottom: '6px'
};

const inputContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: '#FAF0EA',
  border: '1px solid #EFE3DA',
  borderRadius: '10px',
  padding: '10px 14px'
};

const inputStyle = {
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  width: '100%',
  fontSize: '14px',
  color: '#2A2522'
};
