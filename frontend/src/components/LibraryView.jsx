import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Download,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { fetchLibrary, deleteLibraryItem } from '../api';

export default function LibraryView({ user }) {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchLibrary(user?.email || 'guest@nexora.ai', filter);
      setItems(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter, user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this item from your library?")) return;
    try {
      await deleteLibraryItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to delete item: " + err.message);
    }
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={18} color="#C2693F" />;
      case 'audio': return <Music size={18} color="#C2693F" />;
      case 'video': return <Video size={18} color="#C2693F" />;
      default: return <FileText size={18} color="#C2693F" />;
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Files' },
    { id: 'image', label: 'Images' },
    { id: 'audio', label: 'Audio' },
    { id: 'video', label: 'Videos' },
    { id: 'document', label: 'Documents' },
  ];

  return (
    <div style={{
      padding: '36px 48px',
      maxWidth: '1000px',
      margin: '0 auto',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: '#2A2522', margin: '0 0 6px 0' }}>
          Personal Library
        </h2>
        <p style={{ color: '#7E726A', fontSize: '14.5px', margin: 0 }}>
          Manage your uploaded files and generated multimodal creations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #EFE3DA',
        paddingBottom: '12px'
      }}>
        {filterTabs.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '6px 16px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: isActive ? '#C2693F' : '#FAF0EA',
                color: isActive ? '#FFFFFF' : '#6E6259',
                fontWeight: isActive ? '600' : '400',
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: '#8D7F76', padding: '40px 0' }}>Loading your library...</div>
      ) : items.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px dashed #E5D5CA',
          color: '#8D7F76'
        }}>
          <p style={{ fontSize: '15px', fontWeight: '500', color: '#2A2522' }}>No files in your library yet</p>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>
            Upload documents, images, audio, or generate AI media in chat to see them here.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {items.map((item) => {
            const fullUrl = item.file_url.startsWith('/')
              ? `http://127.0.0.1:8000${item.file_url}`
              : item.file_url;

            return (
              <div key={item.id} style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #EFE3DA',
                boxShadow: '0 2px 8px rgba(42, 37, 34, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#FAF0EA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getMediaIcon(item.file_type)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2A2522',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.file_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8D7F76', textTransform: 'capitalize' }}>
                        {item.file_type}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Preview for Images */}
                  {item.file_type === 'image' && (
                    <div style={{
                      height: '130px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      border: '1px solid #F0E5DC'
                    }}>
                      <img
                        src={fullUrl}
                        alt="Thumbnail"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #F4EAE2'
                }}>
                  <a
                    href={fullUrl}
                    download={item.file_name}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#C2693F',
                      textDecoration: 'none',
                      fontSize: '12.5px',
                      fontWeight: '500'
                    }}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                    title="Delete item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
