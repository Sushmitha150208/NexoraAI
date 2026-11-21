import React, { useState, useEffect } from 'react';
import { Heart, Code, Globe, Sparkles, ArrowRight } from 'lucide-react';
import { fetchExplore } from '../api';

export default function ExploreView({ onSelectPrompt }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExplore()
      .then(data => setCategories(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (title) => {
    if (title.includes('Health')) return <Heart size={20} color="#C2693F" />;
    if (title.includes('Tech')) return <Code size={20} color="#C2693F" />;
    if (title.includes('General')) return <Globe size={20} color="#C2693F" />;
    return <Sparkles size={20} color="#C2693F" />;
  };

  return (
    <div style={{
      padding: '36px 48px',
      maxWidth: '1000px',
      margin: '0 auto',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: '#2A2522', margin: '0 0 6px 0' }}>
          Explore Topics & Capabilities
        </h2>
        <p style={{ color: '#7E726A', fontSize: '14.5px', margin: 0 }}>
          Discover curated starter queries across health, programming, general knowledge, and multimodal generation.
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#8D7F76', padding: '40px 0' }}>Loading explore collection...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {categories.map((cat, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#FAF0EA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #EFE3DA'
                }}>
                  {getIcon(cat.title)}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2A2522', margin: 0 }}>
                  {cat.title}
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '14px'
              }}>
                {cat.cards.map((card, cIdx) => (
                  <div
                    key={cIdx}
                    onClick={() => onSelectPrompt(card.prompt)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '18px',
                      border: '1px solid #EFE3DA',
                      boxShadow: '0 2px 8px rgba(42, 37, 34, 0.04)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '120px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(194, 105, 63, 0.12)';
                      e.currentTarget.style.borderColor = '#C2693F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(42, 37, 34, 0.04)';
                      e.currentTarget.style.borderColor = '#EFE3DA';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#2A2522', marginBottom: '6px' }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#6E6259', lineHeight: 1.4 }}>
                        {card.prompt}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C2693F', fontSize: '12px', fontWeight: '600', marginTop: '12px' }}>
                      <span>Try Prompt</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
