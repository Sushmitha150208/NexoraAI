import React from 'react';

/**
 * Renders the 4-petal terracotta flower mark
 */
export function FlowerIcon({ size = 28, color = "#C2693F" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top Petal */}
      <path d="M50 4 C40 25 35 40 50 50 C65 40 60 25 50 4 Z" fill={color} />
      {/* Bottom Petal */}
      <path d="M50 96 C40 75 35 60 50 50 C65 60 60 75 50 96 Z" fill={color} />
      {/* Left Petal */}
      <path d="M4 50 C25 40 40 35 50 50 C40 65 25 60 4 50 Z" fill={color} />
      {/* Right Petal */}
      <path d="M96 50 C75 40 60 35 50 50 C60 65 75 60 96 50 Z" fill={color} />
      {/* Center Glow */}
      <circle cx="50" cy="50" r="4" fill="#F5EDE6" opacity="0.8" />
    </svg>
  );
}

/**
 * Top Sidebar Brand block matching Section 6.2
 */
export function SidebarBrand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 4px' }}>
      <FlowerIcon size={34} color="#C2693F" />
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: '600', letterSpacing: '0.5px', lineHeight: 1.1 }}>
          <span style={{ color: '#F5EDE6' }}>Nexora</span>
          <span style={{ color: '#C2693F', marginLeft: '1px' }}>AI</span>
        </div>
        <div style={{ color: '#9E928A', fontSize: '11px', fontWeight: '400', letterSpacing: '0.4px', marginTop: '2px' }}>
          Multimodal AI Chat
        </div>
      </div>
    </div>
  );
}

/**
 * Center Empty State Logo Mark strictly replicating Section 6.1
 */
export function CenterHeroMark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', userSelect: 'none' }}>
      {/* Celestial Arc & Flower Emblem */}
      <div style={{ position: 'relative', width: '190px', height: '110px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="190" height="110" viewBox="0 0 190 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Thin Celestial Arch */}
          <path d="M 25 90 C 35 25 155 25 165 90" stroke="#C2693F" strokeWidth="1" strokeOpacity="0.45" />
          
          {/* Sparkle on upper right of arc */}
          <path d="M 160 28 Q 160 35 167 35 Q 160 35 160 42 Q 160 35 153 35 Q 160 35 160 28 Z" fill="#C2693F" opacity="0.8" />
        </svg>

        {/* Central 4-petal flower */}
        <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)' }}>
          <FlowerIcon size={46} color="#C2693F" />
        </div>
      </div>

      {/* Main Wordmark */}
      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '54px',
        fontWeight: '500',
        letterSpacing: '1px',
        margin: '0',
        lineHeight: 1.1
      }}>
        <span style={{ color: '#2A2522' }}>Nexora</span>
        <span style={{ color: '#C2693F' }}>AI</span>
      </h1>

      {/* Tagline */}
      <div style={{
        fontSize: '11.5px',
        fontWeight: '600',
        letterSpacing: '5px',
        color: '#2A2522',
        textTransform: 'uppercase',
        marginTop: '10px',
        opacity: 0.85
      }}>
        Multimodal AI Chat
      </div>

      {/* Wavy swoosh ribbon underneath */}
      <svg width="150" height="24" viewBox="0 0 150 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: '12px' }}>
        <path d="M 10 14 Q 45 4 80 14 T 140 14" stroke="#C2693F" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
        <path d="M 25 18 Q 60 8 95 18 T 135 18" stroke="#C2693F" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>
    </div>
  );
}

/**
 * Organic Terracotta Wave Shapes in Top-Left and Bottom-Right corners (SRS Section 6.1)
 */
export function OrganicWaves() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Top Left Organic Wave */}
      <svg
        style={{ position: 'absolute', top: -40, left: -40, width: '420px', height: '420px', opacity: 0.85 }}
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M0 0 L240 0 C220 90 280 150 200 240 C130 320 60 220 0 280 Z"
          fill="url(#top_wave_grad)"
        />
        <path
          d="M0 0 L180 0 C160 80 220 120 160 200 C110 260 50 180 0 230 Z"
          fill="#C2693F"
          fillOpacity="0.4"
        />
        <defs>
          <linearGradient id="top_wave_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C2693F" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#D9825B" stopOpacity="0.25" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottom Right Organic Wave */}
      <svg
        style={{ position: 'absolute', bottom: -50, right: -50, width: '450px', height: '450px', opacity: 0.85 }}
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M400 400 L160 400 C190 310 130 250 210 160 C280 80 340 180 400 120 Z"
          fill="url(#bot_wave_grad)"
        />
        <path
          d="M400 400 L220 400 C240 330 190 280 250 200 C300 130 350 210 400 170 Z"
          fill="#C2693F"
          fillOpacity="0.35"
        />
        <defs>
          <linearGradient id="bot_wave_grad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#C2693F" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#E28963" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
