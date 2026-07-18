import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onAdjust(); }}>
      <DialogContent className="glass-card max-w-[420px] p-8 border border-white/8 shadow-2xl rounded-2xl" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="p-0 mb-4">
          <DialogTitle id="budget-title" className="mono-sm text-amber-500 uppercase tracking-widest text-[10px] font-mono">
            Budget Clearance
          </DialogTitle>
          <DialogDescription className="sr-only">
            Validate if the travel budget matches the estimated costs.
          </DialogDescription>
        </DialogHeader>

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

          <Slider
            value={[userPct]}
            disabled={true}
            className="w-full"
          />

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
            background: 'rgba(245, 158, 11, 0.08)',
            borderLeft: '4px solid var(--color-amber)',
            borderRadius: '0 8px 8px 0',
            fontSize: 13.5, color: 'var(--color-text-secondary)',
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
      </DialogContent>
    </Dialog>
  );
}
