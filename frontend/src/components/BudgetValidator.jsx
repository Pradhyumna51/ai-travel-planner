import React from 'react';

export default function BudgetValidatorModal({
  isOpen, userBudget, estimatedBudget, message, recommendation,
  onContinue, onAdjust,
}) {
  if (!isOpen) return null;

  const low = estimatedBudget?.low || 0;
  const high = estimatedBudget?.high || 1;
  const range = high * 1.3 - low * 0.5;
  const userPct = Math.min(100, Math.max(0, ((userBudget - low * 0.5) / range) * 100));

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="budget-title" style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Backdrop */}
      <div onClick={onAdjust} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        animation: 'fade-in 200ms ease-out',
      }} />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: 32,
        boxShadow: 'var(--shadow-lg)',
        animation: 'slide-up 200ms ease-out',
      }}>
        {/* Header */}
        <p className="mono-sm" style={{ color: 'var(--color-amber)', marginBottom: 16 }}>
          Budget Clearance
        </p>

        <p style={{
          fontSize: 15, color: 'var(--color-text)', margin: '0 0 20px', lineHeight: 1.6,
        }}>
          {message || `₹${userBudget?.toLocaleString('en-IN')} may be tight for this route.`}
        </p>

        {/* Spectrum bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.8px',
            color: 'var(--color-text-dim)', marginBottom: 8,
          }}>
            <span>Budget</span>
            <span>Comfortable</span>
          </div>

          <div style={{
            height: 8, borderRadius: 4, overflow: 'hidden',
            background: 'linear-gradient(90deg, #f87171 0%, #f59e0b 50%, #34d399 100%)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: `${userPct}%`,
              top: -2, bottom: -2, width: 2,
              background: '#ffffff', borderRadius: 1,
              transform: 'translateX(-50%)',
              boxShadow: '0 0 6px rgba(255,255,255,0.4)',
            }} />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-dim)', marginTop: 6,
          }}>
            <span>₹{low?.toLocaleString('en-IN')}</span>
            <span>₹{high?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--color-amber-dim)',
            borderLeft: '3px solid var(--color-amber)',
            borderRadius: '0 6px 6px 0',
            fontSize: 13, color: 'var(--color-text-secondary)',
            marginBottom: 24, lineHeight: 1.5,
          }}>
            {recommendation}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onAdjust} className="btn-ghost" style={{ flex: 1 }}>
            Adjust Budget
          </button>
          <button onClick={onContinue} className="btn-amber" style={{ flex: 1 }}>
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
