import React, { useState, useEffect } from 'react';

const STAGES = [
  { pct: 12, msg: 'Analyzing destination…' },
  { pct: 28, msg: 'Checking seasonal conditions…' },
  { pct: 45, msg: 'Mapping nearby attractions…' },
  { pct: 62, msg: 'Optimizing routes…' },
  { pct: 78, msg: 'Selecting accommodations…' },
  { pct: 90, msg: 'Balancing budget…' },
  { pct: 98, msg: 'Assembling itinerary…' },
];

export default function LoadingSpinner({ destination }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = STAGES.map((_, i) =>
      setTimeout(() => setStage(i), i * 1800)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const current = STAGES[stage];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '100px 24px',
      animation: 'fade-in 400ms ease-out',
    }}>
      {/* Animated SVG Path */}
      <svg width="280" height="120" viewBox="0 0 280 120" style={{ marginBottom: 20 }}>
        <defs>
          <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-teal)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--color-teal)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-lavender)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M 30 90 C 90 20, 190 20, 250 90"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 30 90 C 90 20, 190 20, 250 90"
          fill="none"
          stroke="url(#route-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="400"
          strokeDashoffset="400"
          style={{
            animation: 'dash-path 4s ease-in-out infinite'
          }}
        />
        <g>
          <path
            d="M-6,-6 L6,0 L-6,6 L-3,0 Z"
            fill="var(--color-teal)"
          />
          <animateMotion
            path="M 30 90 C 90 20, 190 20, 250 90"
            dur="4s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </g>
      </svg>

      {/* Route line with nodes */}
      <div style={{ width: 320, marginBottom: 40, position: 'relative' }}>
        {/* Track */}
        <div style={{
          height: 2, background: 'var(--color-border)', borderRadius: 1,
          position: 'relative',
        }}>
          {/* Fill */}
          <div style={{
            height: '100%', background: 'var(--color-teal)',
            borderRadius: 1, transition: 'width 1.2s ease-out',
            width: `${current.pct}%`,
            boxShadow: '0 0 8px var(--color-teal-dim)',
          }} />
        </div>

        {/* Nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -5, position: 'relative' }}>
          {STAGES.map((s, i) => {
            const active = i <= stage;
            return (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: active ? 'var(--color-teal)' : 'var(--color-border)',
                border: active ? '2px solid var(--color-teal)' : '2px solid var(--color-border)',
                transition: 'all 300ms ease-out',
                boxShadow: active ? '0 0 8px var(--color-teal-dim)' : 'none',
                animation: active && i === stage ? 'node-appear 300ms ease-out' : 'none',
              }} />
            );
          })}
        </div>
      </div>

      {/* Status */}
      <h3 style={{
        fontSize: 18, fontWeight: 600, color: 'var(--color-text)',
        margin: '0 0 8px', textAlign: 'center',
      }}>
        {destination
          ? `Assembling your journey through ${destination}`
          : 'Assembling your journey'}
      </h3>

      <p key={stage} style={{
        fontFamily: 'var(--font-mono)', fontSize: 13,
        color: 'var(--color-teal)', margin: '0 0 24px',
        animation: 'fade-in 400ms ease-out', textAlign: 'center',
      }}>
        {current.msg}
      </p>

      {/* Progress bar */}
      <div style={{
        width: 200, height: 3,
        background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${current.pct}%`,
          background: 'var(--color-teal)', borderRadius: 2,
          transition: 'width 1s ease-out',
        }} />
      </div>

      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--color-text-dim)', marginTop: 12,
      }}>
        Usually takes 10–15 seconds
      </p>
    </div>
  );
}
