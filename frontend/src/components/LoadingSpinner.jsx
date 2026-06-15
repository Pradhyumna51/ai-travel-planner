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
