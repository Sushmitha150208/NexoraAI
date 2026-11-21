import React, { useState } from 'react';
import { User, Volume2, Shield, Download, Trash2, LogOut } from 'lucide-react';

export default function SettingsView({ user, onSignOut, conversations }) {
  const [voice, setVoice] = useState('natural');
  const [autoSpeech, setAutoSpeech] = useState(false);

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
      maxWidth: '800px',
      margin: '0 auto',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: '#2A2522', margin: '0 0 6px 0' }}>
          Settings & Preferences
        </h2>
        <p style={{ color: '#7E726A', fontSize: '14.5px', margin: 0 }}>
          Manage your account profile, multimodal speech preferences, and data privacy.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <User size={20} color="#C2693F" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2A2522', margin: 0 }}>User Profile</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={valueStyle}>{user?.name || 'Guest User'}</div>
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={valueStyle}>{user?.email || 'guest@nexora.ai'}</div>
            </div>
          </div>
        </div>

        {/* Audio / Voice Settings */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Volume2 size={20} color="#C2693F" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2A2522', margin: 0 }}>Multimodal Audio & Voice</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
        </div>

        {/* Privacy & Policies */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={20} color="#C2693F" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2A2522', margin: 0 }}>Privacy & Policies</h3>
          </div>
          <p style={{ fontSize: '13.5px', color: '#6E6259', lineHeight: 1.5, margin: '0 0 12px 0' }}>
            NexoraAI operates strictly under enterprise privacy policies (Section 8). Your uploaded documents and personal chats are private to your account and never used to train public models.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExportAll}
              style={{
                display: 'flex',
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
        </div>

        {/* Sign Out Card */}
        <div style={{ ...cardStyle, border: '1px solid #FFD8D4' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#dc3545', margin: '0 0 8px 0' }}>Session Management</h3>
          <p style={{ fontSize: '13px', color: '#8D7F76', margin: '0 0 16px 0' }}>
            Sign out of your active NexoraAI session. Your chats remain safely saved in your account.
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
