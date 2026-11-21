import React, { useState } from 'react';
import { User, Volume2, Shield, Download, Lock, Eye, EyeOff, LogOut, CheckCircle } from 'lucide-react';
import { authService } from '../api';

export default function SettingsView({ user, onSignOut, conversations, onUpdateUser }) {
  const [voice, setVoice] = useState('natural');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState(user?.password || localStorage.getItem('password') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const storedPassword = user?.password || localStorage.getItem('password') || '••••••••';

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    const updated = { ...user, password: newPassword };
    authService.setUser(updated, newPassword);
    if (onUpdateUser) onUpdateUser(updated);
    setIsEditingPassword(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `nexora_all_chats_${Date.now()}.json`);
    dlAnchor.click();
  };

  return (
    <div style={{
      padding: '36px 48px',
      maxWidth: '820px',
      margin: '0 auto',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: '#2A2522', margin: '0 0 6px 0' }}>
          Settings & Preferences
        </h2>
        <p style={{ color: '#7E726A', fontSize: '14.5px', margin: 0 }}>
          Manage your account profile, credentials stored in localStorage, and preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile & Credentials Card (Constraint 5 & FR-AUTH-04) */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} color="#C2693F" />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2A2522', margin: 0 }}>Account Credentials</h3>
            </div>
            
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11.5px',
              fontWeight: '500',
              backgroundColor: '#EAF7EE',
              color: '#28a745',
              padding: '3px 8px',
              borderRadius: '999px',
              border: '1px solid #D4EDDA'
            }}>
              <CheckCircle size={12} />
              <span>Stored in localStorage</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={valueStyle}>{user?.name || 'Guest User'}</div>
            </div>
            <div>
              <label style={labelStyle}>Email Address (Saved in localStorage)</label>
              <div style={valueStyle}>{user?.email || 'guest@nexora.ai'}</div>
            </div>
          </div>

          {/* Stored Password Display & Edit */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={labelStyle}>Password (Temporarily stored in localStorage)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C2693F',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPassword ? 'Hide' : 'Reveal Password'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(!isEditingPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C2693F',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline'
                  }}
                >
                  {isEditingPassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>
            </div>

            {isEditingPassword ? (
              <form onSubmit={handleSavePassword} style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 chars)"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #C2693F',
                    backgroundColor: '#FFFDF9',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#C2693F',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Save to localStorage
                </button>
              </form>
            ) : (
              <div style={{
                ...valueStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: showPassword ? 'inherit' : 'monospace',
                letterSpacing: showPassword ? 'normal' : '2px'
              }}>
                <span>{showPassword ? storedPassword : '••••••••••••'}</span>
                <Lock size={14} color="#8D7F76" />
              </div>
            )}

            {savedSuccess && (
              <div style={{ color: '#28a745', fontSize: '12px', marginTop: '6px' }}>
                ✓ Password updated and saved in localStorage (`nexora_credentials`, `password`).
              </div>
            )}
          </div>
        </div>

        {/* Audio / Voice Settings */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Volume2 size={20} color="#C2693F" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2A2522', margin: 0 }}>Multimodal Audio & Voice</h3>
          </div>
          <div>
            <label style={labelStyle}>Default Voice Persona</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #E5D5CA',
                backgroundColor: '#FAF0EA',
                fontSize: '14px',
                color: '#2A2522',
                outline: 'none'
              }}
            >
              <option value="natural">Nexora Natural Warm (Default)</option>
              <option value="studio">Nexora Studio Clarity</option>
              <option value="balanced">Nexora Melodic Balanced</option>
            </select>
          </div>
        </div>

        {/* Privacy & Policies */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={20} color="#C2693F" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2A2522', margin: 0 }}>Data & History Controls</h3>
          </div>
          <p style={{ fontSize: '13.5px', color: '#6E6259', lineHeight: 1.5, margin: '0 0 14px 0' }}>
            Your conversations and private uploads are isolated to your account. You can export your full conversation records at any time.
          </p>
          <button
            onClick={handleExportAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#FAF0EA',
              border: '1px solid #E5D5CA',
              color: '#2A2522',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Download size={14} color="#C2693F" />
            <span>Export All Chats (JSON)</span>
          </button>
        </div>

        {/* Sign Out Card */}
        <div style={{ ...cardStyle, border: '1px solid #FFD8D4' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#dc3545', margin: '0 0 8px 0' }}>Session Management</h3>
          <p style={{ fontSize: '13px', color: '#8D7F76', margin: '0 0 16px 0' }}>
            Sign out of your active session. Clicking Sign Out clears the session and returns to Sign In.
          </p>
          <button
            onClick={onSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#dc3545',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid #EFE3DA',
  boxShadow: '0 2px 8px rgba(42, 37, 34, 0.04)'
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#8D7F76',
  marginBottom: '4px'
};

const valueStyle = {
  fontSize: '14px',
  color: '#2A2522',
  fontWeight: '500',
  padding: '8px 12px',
  backgroundColor: '#FAF0EA',
  borderRadius: '8px',
  border: '1px solid #EFE3DA'
};
