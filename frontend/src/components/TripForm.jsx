import React, { useState, useEffect, useCallback } from 'react';

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
    <div className="glass-card" style={{
      maxWidth: 580, margin: '0 auto',
      borderRadius: '20px',
      padding: '40px 40px 36px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p className="mono-sm" style={{ marginBottom: 10 }}>Departure Briefing</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>
          Where to next?
        </h1>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="alert-error" style={{ marginBottom: 20 }} role="alert">
          <span style={{ flexShrink: 0 }}>!</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>{apiError}</p>
            {onRetry && (
              <button onClick={onRetry} style={{
                marginTop: 6, fontSize: 12, color: 'var(--color-danger)',
                fontWeight: 600, background: 'none', border: 'none',
                cursor: 'pointer', padding: 0, textDecoration: 'underline',
                fontFamily: 'var(--font-mono)',
              }}>
                Retry →
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        {/* Origin + Destination */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Field id="origin" label="Origin" placeholder="Mumbai, Delhi…"
            value={form.origin} onChange={onChange} onBlur={onBlur}
            disabled={isLoading} error={err('origin')} />
          <Field id="destination" label="Destination" placeholder="Tokyo, Paris…"
            value={form.destination} onChange={onChange} onBlur={onBlur}
            disabled={isLoading} error={err('destination')} />
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 20px' }} />

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Field id="start_date" label="Depart" type="date" min={today}
            value={form.start_date} onChange={onChange} onBlur={onBlur}
            disabled={isLoading} error={err('start_date')} />
          <Field id="end_date" label="Return" type="date" min={form.start_date || today}
            value={form.end_date} onChange={onChange} onBlur={onBlur}
            disabled={isLoading} error={err('end_date')} />
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 20px' }} />

        {/* Budget + Travelers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Field id="budget" label="Budget (₹)" type="number" min="1000"
            placeholder="250000" value={form.budget} onChange={onChange}
            onBlur={onBlur} disabled={isLoading} error={err('budget')}
            hint="~30% hotels · 20% food" />
          <Field id="travelers" label="Travelers" type="number" min="1" max="20"
            value={form.travelers} onChange={onChange} onBlur={onBlur}
            disabled={isLoading} error={err('travelers')} />
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 24px' }} />

        {/* Travel Style */}
        <div style={{ marginBottom: 24 }}>
          <label className="field-label">Travel Style</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 4 }}>
            {['budget', 'standard', 'luxury'].map(style => {
              const isSelected = form.travel_style === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, travel_style: style }))}
                  disabled={isLoading}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: isSelected ? '1px solid var(--color-teal)' : '1px solid var(--color-border)',
                    background: isSelected ? 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(167,139,250,0.15) 100%)' : 'rgba(255,255,255,0.02)',
                    color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                    boxShadow: isSelected ? '0 0 12px rgba(236,72,153,0.15)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 24px' }} />

        {/* Interests */}
        <div style={{ marginBottom: 28 }}>
          <label className="field-label">Interests</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {INTERESTS.map(v => (
              <button key={v} type="button" onClick={() => toggle(v)}
                disabled={isLoading}
                className={`interest-tag${form.interests.includes(v) ? ' selected' : ''}`}
                aria-pressed={form.interests.includes(v)}>
                {v}
              </button>
            ))}
          </div>
          {err('interests') && <p className="field-error">{errors.interests}</p>}
        </div>

        {/* Submit */}
        <button type="submit" disabled={!isValid || isLoading}
          className="btn-primary"
          style={{ width: '100%', padding: '13px 28px', fontSize: 15, fontWeight: 600 }}>
          {isLoading ? 'Assembling…' : 'Assemble Journey'}
        </button>

        <p style={{
          textAlign: 'center', marginTop: 16, fontSize: 11,
          color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)',
        }}>
          Your data stays in this session. Nothing stored.
        </p>
      </form>
    </div>
  );
}

/* Reusable field wrapper */
function Field({ id, label, type = 'text', error, hint, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} name={id} type={type}
        autoComplete="off"
        style={type === 'date' ? { colorScheme: 'dark' } : undefined}
        className={`field-input${error ? ' error' : ''}`}
        {...inputProps} />
      {error ? <p className="field-error">{error}</p>
             : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
