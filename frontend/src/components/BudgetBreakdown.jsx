import React from 'react';

const CATS = {
  flights:     { label: 'Flights',          color: '#60a5fa' },
  hotels:      { label: 'Hotels',           color: '#34d399' },
  food:        { label: 'Food & Dining',    color: '#fbbf24' },
  transport:   { label: 'Local Transport',  color: '#a78bfa' },
  activities:  { label: 'Activities',       color: '#f472b6' },
  contingency: { label: 'Contingency',      color: '#64748b' },
};

export default function BudgetBreakdown({ breakdown, userBudget }) {
  if (!breakdown) return null;

  const total = breakdown.total || 1;
  const maxAmount = Math.max(...Object.entries(breakdown)
    .filter(([k]) => k !== 'total' && CATS[k])
    .map(([, v]) => v), 1);

  const entries = Object.entries(breakdown)
    .filter(([k]) => k !== 'total' && CATS[k])
    .map(([key, amount]) => ({
      key, amount,
      pct: Math.round((amount / total) * 100),
      barPct: Math.round((amount / maxAmount) * 100),
      ...CATS[key],
    }));

  const remaining = userBudget ? userBudget - total : null;

  return (
    <div>
      <p className="mono-sm" style={{ marginBottom: 20 }}>Budget</p>

      {/* Fuel bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {entries.map(({ key, label, amount, pct, barPct, color }) => (
          <div key={key}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginBottom: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span className="mono-cost" style={{
                  fontSize: 13, color: 'var(--color-text)',
                }}>
                  ₹{amount?.toLocaleString('en-IN')}
                </span>
                <span style={{
                  fontSize: 11, color: 'var(--color-text-dim)',
                  fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'right',
                }}>
                  {pct}%
                </span>
              </div>
            </div>
            <div className="fuel-bar-track">
              <div className="fuel-bar-fill" style={{ width: `${barPct}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        marginTop: 20, paddingTop: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span className="mono-sm">Total</span>
        <span className="mono-cost" style={{
          fontSize: 18, color: 'var(--color-text)',
        }}>
          ₹{total?.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Remaining */}
      {remaining !== null && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: remaining >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1px solid ${remaining >= 0 ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
          borderRadius: 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{
            fontSize: 12, fontFamily: 'var(--font-mono)',
            color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {remaining >= 0 ? 'Remaining' : 'Over budget'}
          </span>
          <span className="mono-cost" style={{
            fontSize: 14,
            color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {remaining >= 0 ? '+' : ''}₹{Math.abs(remaining).toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
}
