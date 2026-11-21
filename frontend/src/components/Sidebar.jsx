import React, { useState } from 'react';
import {
  MessageSquare,
  Compass,
  Folder,
  Settings,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Download,
  Pin
} from 'lucide-react';
import { SidebarBrand } from './BrandLogo';

export default function Sidebar({
  activeNav,
  setActiveNav,
  conversations,
  activeConvId,
  onSelectConv,
  onNewChat,
  onRenameConv,
  onDeleteConv
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'library', label: 'Library', icon: Folder },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConv(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleExportChat = (conv, e) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conv, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${conv.title.replace(/\s+/g, '_')}_history.json`);
    dlAnchor.click();
    setMenuOpenId(null);
  };

  return (
    <aside style={{
      width: '270px',
      minWidth: '270px',
      backgroundColor: '#2A2522',
      color: '#F5EDE6',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'relative',
      zIndex: 20,
      borderRight: '1px solid rgba(255, 255, 255, 0.04)',
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px 16px 20px' }}>
        <SidebarBrand />
      </div>

      {/* Primary Navigation */}
      <nav style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? '#C2693F' : 'transparent',
                color: isActive ? '#FFFFFF' : '#C7BBB2',
                fontWeight: isActive ? '600' : '400',
                fontSize: '14.5px',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={19} color={isActive ? '#FFFFFF' : '#A89B92'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ margin: '14px 20px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Recent Chats Section */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '0 16px' }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px 12px 8px'
        }}>
          <span style={{ fontSize: '13.5px', fontWeight: '500', color: '#9E928A', letterSpacing: '0.2px' }}>
            Recent Chats
          </span>
          <button
            onClick={onNewChat}
            title="Start new chat"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#C2693F',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease, background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#AF5B33';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#C2693F';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Chat List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '4px' }}>
          {conversations.length === 0 ? (
            <div style={{ color: '#7E726A', fontSize: '13px', padding: '16px 8px', fontStyle: 'italic' }}>
              No chats yet. Click '+' to start one.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeNav === 'chat' && activeConvId === conv.id;
              const isMenuOpen = menuOpenId === conv.id;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConv(conv.id);
                    setActiveNav('chat');
                  }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(194, 105, 63, 0.22)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : '#D4C8C0',
                    fontSize: '13.5px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                    <MessageSquare size={16} color={isSelected ? '#C2693F' : '#8A7D74'} style={{ flexShrink: 0 }} />
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={(e) => handleSaveRename(conv.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(conv.id, e);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: '#1F1B18',
                          border: '1px solid #C2693F',
                          color: '#FFFFFF',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '13px',
                          width: '100%',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: isSelected ? '500' : '400'
                      }}>
                        {conv.title}
                      </span>
                    )}
                  </div>

                  {/* Options Menu Button (...) */}
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : conv.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isSelected ? '#C2693F' : '#8A7D74',
                        cursor: 'pointer',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px'
                      }}
                      title="Chat options"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '36px',
                        backgroundColor: '#1E1A18',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '6px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                        zIndex: 50,
                        minWidth: '130px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        style={dropdownItemStyle}
                      >
                        <Edit2 size={13} color="#D4C8C0" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={(e) => handleExportChat(conv, e)}
                        style={dropdownItemStyle}
                      >
                        <Download size={13} color="#D4C8C0" />
                        <span>Export</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConv(conv.id);
                          setMenuOpenId(null);
                        }}
                        style={{ ...dropdownItemStyle, color: '#f87171' }}
                      >
                        <Trash2 size={13} color="#f87171" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sidebar Footer Decorative Curved Wave Pattern (SRS 6.2) */}
      <div style={{ height: '70px', position: 'relative', overflow: 'hidden', opacity: 0.28, pointerEvents: 'none' }}>
        <svg viewBox="0 0 270 70" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-10 50 C 40 10, 100 65, 170 30 C 220 5, 260 45, 290 20" stroke="#C2693F" strokeWidth="2.2" />
          <path d="M-10 65 C 50 25, 110 75, 180 45 C 230 20, 260 55, 290 35" stroke="#F5EDE6" strokeWidth="1.5" />
          <path d="M10 80 C 70 40, 130 85, 200 60 C 240 40, 270 70, 290 50" stroke="#C2693F" strokeWidth="1.2" strokeDasharray="4 4" />
        </svg>
      </div>
    </aside>
  );
}

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 10px',
  background: 'none',
  border: 'none',
  color: '#E0D6CE',
  fontSize: '12.5px',
  borderRadius: '5px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'background 0.15s ease'
};
