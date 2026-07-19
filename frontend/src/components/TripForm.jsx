import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, IndianRupee, Compass, ArrowRight, RefreshCw } from 'lucide-react';

const INTERESTS = [
  'Food', 'Photography', 'Trekking', 'Nature', 'Anime',
  'Nightlife', 'History', 'Shopping', 'Adventure',
];

const EMPTY = {
  origin: '', destination: '', start_date: '', end_date: '',
  budget: '', travelers: 1, interests: [],
  travel_style: 'standard',
};

function validate(d) {
  const e = {};
  const today = new Date().toISOString().split('T')[0];
  if (!d.origin.trim()) e.origin = 'Origin city is required';
  if (!d.destination.trim()) e.destination = 'Destination is required';
  if (!d.start_date) e.start_date = 'Select a departure date';
  else if (d.start_date < today) e.start_date = 'Must be a future date';
  if (!d.end_date) e.end_date = 'Select a return date';
  else if (d.start_date && d.end_date <= d.start_date) e.end_date = 'Return must be after departure';
  const b = Number(d.budget);
  if (!d.budget) e.budget = 'Enter a budget amount';
  else if (isNaN(b) || b < 1000) e.budget = 'Minimum ₹1,000';
  const t = Number(d.travelers);
  if (!d.travelers || t < 1 || t > 20) e.travelers = '1–20 travelers';
  if (d.interests.length === 0) e.interests = 'Select at least one interest';
  return e;
}

export default function TripPlanningForm({ onSubmit, isLoading, apiError, onRetry }) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const e = validate(form);
    setErrors(e);
    setIsValid(Object.keys(e).length === 0);
  }, [form]);

  const onChange = useCallback(e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }, []);

  const onBlur = useCallback(e => {
    setTouched(p => ({ ...p, [e.target.name]: true }));
  }, []);

  const toggle = useCallback(v => {
    setForm(p => ({
      ...p,
      interests: p.interests.includes(v)
        ? p.interests.filter(i => i !== v)
        : [...p.interests, v],
    }));
    setTouched(p => ({ ...p, interests: true }));
  }, []);

  const submit = e => {
    e.preventDefault();
    const all = Object.fromEntries(
      ['origin','destination','start_date','end_date','budget','travelers','interests'].map(k => [k, true])
    );
    setTouched(all);
    if (!isValid || isLoading) return;
    onSubmit({ ...form, budget: Number(form.budget), travelers: Number(form.travelers) });
  };

  const err = f => touched[f] && errors[f];

  return (
    <Card className="glass-card w-full max-w-[580px] mx-auto p-10 pb-9 border border-pink-500/10 shadow-[0_12px_40px_0_rgba(0,0,0,0.5),0_0_20px_rgba(236,72,153,0.03)] rounded-2xl relative overflow-hidden">
      {/* Decorative top glow bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 3,
        background: 'linear-gradient(90deg, #be185d 0%, #ec4899 50%, #a78bfa 100%)'
      }} />

      <CardHeader className="p-0 mb-8 flex flex-row items-start justify-between">
        <div>
          <CardDescription className="mono-sm mb-1.5 text-pink-500 uppercase tracking-widest text-[10px] font-bold">
            DEPARTURE BRIEFING
          </CardDescription>
          <CardTitle className="text-2xl font-extrabold text-white tracking-tight font-sans">
            Where to next?
          </CardTitle>
        </div>
        <div style={{
          background: 'rgba(236, 72, 153, 0.1)',
          borderRadius: 12,
          padding: 8,
          color: 'var(--color-teal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(236, 72, 153, 0.2)'
        }}>
          <Compass className="size-6 animate-pulse" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* API Error */}
        {apiError && (
          <div className="alert-error" style={{ marginBottom: 24, borderRadius: 10 }} role="alert">
            <span style={{ flexShrink: 0, fontSize: 16 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{apiError}</p>
              {onRetry && (
                <button onClick={onRetry} style={{
                  marginTop: 6, fontSize: 12, color: 'var(--color-danger)',
                  fontWeight: 700, background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, textDecoration: 'underline',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <RefreshCw className="size-3" /> Retry Generation
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={submit} noValidate>
          {/* Origin + Destination */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Field id="origin" label="Origin" placeholder="Mumbai, Delhi…"
              value={form.origin} onChange={onChange} onBlur={onBlur}
              disabled={isLoading} error={err('origin')} 
              icon={<MapPin className="size-4 text-slate-400" />} />
            <Field id="destination" label="Destination" placeholder="Tokyo, Paris…"
              value={form.destination} onChange={onChange} onBlur={onBlur}
              disabled={isLoading} error={err('destination')} 
              icon={<MapPin className="size-4 text-pink-500" />} />
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 24px' }} />

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Field id="start_date" label="Depart" type="date" min={today}
              value={form.start_date} onChange={onChange} onBlur={onBlur}
              disabled={isLoading} error={err('start_date')} 
              icon={<Calendar className="size-4 text-slate-400" />} />
            <Field id="end_date" label="Return" type="date" min={form.start_date || today}
              value={form.end_date} onChange={onChange} onBlur={onBlur}
              disabled={isLoading} error={err('end_date')} 
              icon={<Calendar className="size-4 text-pink-500" />} />
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 24px' }} />

          {/* Budget + Travelers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Field id="budget" label="Budget (₹)" type="number" min="1000"
              placeholder="250000" value={form.budget} onChange={onChange}
              onBlur={onBlur} disabled={isLoading} error={err('budget')}
              hint="~30% hotels · 20% food" 
              icon={<IndianRupee className="size-4 text-slate-400" />} />
            <Field id="travelers" label="Travelers" type="number" min="1" max="20"
              value={form.travelers} onChange={onChange} onBlur={onBlur}
              disabled={isLoading} error={err('travelers')} 
              icon={<Users className="size-4 text-slate-400" />} />
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 24px' }} />

          {/* Travel Style */}
          <div style={{ marginBottom: 24 }}>
            <label className="field-label">Travel Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 6 }}>
              {['budget', 'standard', 'luxury'].map(style => {
                const isSelected = form.travel_style === style;
                let activeGlow = 'rgba(236,72,153,0.15)';
                if (style === 'budget') activeGlow = 'rgba(52, 211, 153, 0.15)';
                if (style === 'standard') activeGlow = 'rgba(167, 139, 250, 0.15)';

                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, travel_style: style }))}
                    disabled={isLoading}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      border: isSelected ? '1px solid var(--color-teal)' : '1px solid var(--color-border)',
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(167,139,250,0.15) 100%)' 
                        : 'rgba(15, 12, 30, 0.35)',
                      color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                      boxShadow: isSelected ? `0 0 16px ${activeGlow}` : 'none',
                      cursor: 'pointer',
                      transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>{style}</span>
                    <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.6, textTransform: 'none' }}>
                      {style === 'budget' ? 'Backpacker' : style === 'standard' ? 'Comfortable' : 'First Class'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 24px' }} />

          {/* Interests */}
          <div style={{ marginBottom: 32 }}>
            <label className="field-label">Interests</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {INTERESTS.map(v => {
                const isSelected = form.interests.includes(v);
                return (
                  <Badge
                    key={v}
                    variant="outline"
                    className={`cursor-pointer font-sans px-3.5 py-2.5 h-auto rounded-lg text-xs font-semibold select-none transition-all ${
                      isSelected
                        ? "bg-pink-500/20 border-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.2)]"
                        : "bg-surface-raised border-border text-slate-300 hover:border-pink-500/40 hover:text-white"
                    }`}
                    onClick={() => toggle(v)}
                    render={<button type="button" disabled={isLoading} />}
                  >
                    {v}
                  </Badge>
                );
              })}
            </div>
            {err('interests') && <p className="field-error">{errors.interests}</p>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={!isValid || isLoading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px 28px', fontSize: 15, fontWeight: 700, gap: 10 }}>
            {isLoading ? 'Assembling Journey…' : <>Assemble Journey <ArrowRight className="size-4" /></>}
          </button>

          <p style={{
            textAlign: 'center', marginTop: 16, fontSize: 11,
            color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)',
          }}>
            Your data stays in this session. Nothing stored.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

/* Reusable field wrapper with absolute icon positioning */
function Field({ id, label, type = 'text', error, hint, icon, ...inputProps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label htmlFor={id} className="field-label">{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: 4 }}>
        {icon && (
          <div style={{ position: 'absolute', left: 14, color: 'var(--color-text-dim)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            {icon}
          </div>
        )}
        <input id={id} name={id} type={type}
          autoComplete="off"
          style={{
            paddingLeft: icon ? '40px' : '14px',
            ...(type === 'date' ? { colorScheme: 'dark' } : {})
          }}
          className={`field-input${error ? ' error' : ''}`}
          {...inputProps} />
      </div>
      {error ? <p className="field-error">{error}</p>
             : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
