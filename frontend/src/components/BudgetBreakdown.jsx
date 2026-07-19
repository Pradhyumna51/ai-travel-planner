import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Plane, Building, Utensils, Car, Camera, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

const CATS = {
  flights:     { label: 'Flights',          color: '#38bdf8', icon: Plane },
  hotels:      { label: 'Hotels',           color: '#34d399', icon: Building },
  food:        { label: 'Food & Dining',    color: '#f59e0b', icon: Utensils },
  transport:   { label: 'Local Transport',  color: '#a78bfa', icon: Car },
  activities:  { label: 'Activities',       color: '#f472b6', icon: Camera },
  contingency: { label: 'Contingency',      color: '#94a3b8', icon: AlertCircle },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p className="mono-sm text-pink-500 font-bold" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp className="size-3.5" /> Budget Breakdown
        </p>
        <span style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
          ESTIMATED COSTS
        </span>
      </div>

      {/* Fuel bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {entries.map(({ key, label, amount, pct, barPct, color, icon: IconComponent }) => (
          <div key={key}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: `${color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: color,
                  border: `1px solid ${color}20`,
                  flexShrink: 0
                }}>
                  <IconComponent className="size-3.5" />
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="mono-cost text-xs" style={{
                  color: 'var(--color-text)', fontWeight: 'bold'
                }}>
                  ₹{amount?.toLocaleString('en-IN')}
                </span>
                <span style={{
                  fontSize: 10, color: 'var(--color-text-dim)',
                  fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'right',
                }}>
                  {pct}%
                </span>
              </div>
            </div>
            {/* Custom styled progress bar */}
            <div className="fuel-bar-track" style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
              <div 
                className="fuel-bar-fill" 
                style={{ 
                  width: `${barPct}%`, 
                  background: color, 
                  height: '100%', 
                  borderRadius: 4,
                  boxShadow: `0 0 10px ${color}30`
                }} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        marginTop: 24, paddingTop: 18,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span className="mono-sm text-slate-300 font-bold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <DollarSign className="size-4 text-slate-400" /> Total Cost
        </span>
        <span className="mono-cost text-xl font-extrabold" style={{
          color: 'var(--color-text)',
        }}>
          ₹{total?.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Remaining */}
      {remaining !== null && (
        <div style={{
          marginTop: 16, padding: '14px 16px',
          background: remaining >= 0 ? 'rgba(52, 211, 153, 0.04)' : 'rgba(248, 113, 113, 0.04)',
          border: `1px solid ${remaining >= 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
          borderRadius: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: remaining >= 0 ? '0 0 12px rgba(52, 211, 153, 0.02)' : '0 0 12px rgba(248, 113, 113, 0.02)',
        }}>
          <Badge
            variant={remaining >= 0 ? "default" : "destructive"}
            className="text-[9px] font-mono tracking-wider uppercase font-bold h-6 px-2.5 rounded-md"
            style={remaining >= 0 ? {
              background: "rgba(52, 211, 153, 0.12)",
              color: "#34d399",
              border: "1px solid rgba(52, 211, 153, 0.2)"
            } : {
              background: "rgba(248, 113, 113, 0.12)",
              color: "#f87171",
              border: "1px solid rgba(248, 113, 113, 0.2)"
            }}
          >
            {remaining >= 0 ? 'Remaining' : 'Over budget'}
          </Badge>
          <span className="mono-cost text-base" style={{
            fontWeight: 800,
            color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {remaining >= 0 ? '+' : ''}₹{Math.abs(remaining).toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
}
