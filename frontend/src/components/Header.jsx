import React, { useState } from 'react';
import { Bell, LogOut, CheckCircle, User as UserIcon, X } from 'lucide-react';

export default function Header({ user, onSignOut, notifications, onMarkNotificationsRead }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header style={{
      position: 'absolute',
      top: 0,
      right: 0,
      padding: '24px 36px',
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
      zIndex: 30,
      userSelect: 'none'
    }}>
      {/* Notification Bell */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowUserMenu(false);
            if (!showNotifications && unreadCount > 0) {
              onMarkNotificationsRead();
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2A2522',
            position: 'relative'
          }}
          title="Notifications"
        >
          <Bell size={21} strokeWidth={1.8} />
          
          {/* Orange Dot Badge (SRS Section 4.9 & 6.1) */}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '5px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#C2693F',
              border: '2px solid #FAF0EA'
            }} />
          )}
        </button>

        {/* Notifications Dropdown Panel */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '42px',
            width: '320px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(42, 37, 34, 0.15)',
            border: '1px solid #EFE3DA',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F4EAE2', paddingBottom: '8px' }}>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#2A2522' }}>Notifications</span>
              <button
                onClick={() => setShowNotifications(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8D7F76' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: '#8D7F76', textAlign: 'center', padding: '16px 0' }}>
                  No new notifications.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: n.read ? '#FAF6F2' : '#FDF0E9',
                    fontSize: '12.5px'
                  }}>
                    <div style={{ fontWeight: '600', color: '#2A2522', marginBottom: '2px' }}>{n.title}</div>
                    <div style={{ color: '#6A5F57', lineHeight: 1.35 }}>{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thin Vertical Divider */}
      <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(42, 37, 34, 0.2)' }} />

      {/* User Circular Dark Avatar */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setShowUserMenu(!showUserMenu);
            setShowNotifications(false);
          }}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#2A2522',
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(42, 37, 34, 0.18)',
            transition: 'transform 0.15s ease'
          }}
          title={user?.name || "Account Menu"}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {initial}
        </button>

        {/* User Dropdown Menu */}
        {showUserMenu && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '48px',
            width: '240px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 12px 36px rgba(42, 37, 34, 0.16)',
            border: '1px solid #EFE3DA',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ padding: '6px 8px', borderBottom: '1px solid #F4EAE2' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#2A2522' }}>{user?.name || 'Guest User'}</div>
              <div style={{ fontSize: '12px', color: '#8D7F76', wordBreak: 'break-all' }}>{user?.email || 'guest@nexora.ai'}</div>
            </div>

            <button
              onClick={() => {
                setShowUserMenu(false);
                onSignOut();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#d9534f',
                fontSize: '13.5px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF0EE'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
