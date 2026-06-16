import React, { useState, useMemo, useCallback } from 'react';
import BudgetBreakdown from './BudgetBreakdown';
import { saveTrip } from '../services/api';

/* ── helpers ──────────────────────────────── */
function groupDaysByCity(itinerary = []) {
  const groups = [];
  let cur = null;
  itinerary.forEach(day => {
    if (!cur || cur.city !== day.city) {
      cur = { city: day.city, days: [] };
      groups.push(cur);
    }
    cur.days.push(day);
  });
  return groups;
}

/* ── City accordion ──────────────────────── */
function CityGroup({ city, days, startDay, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const endDay = startDay + days.length - 1;
  const cityTotal = days.reduce((s, d) => s + (d.estimated_cost || 0), 0);

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Timeline node + header */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Node */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, width: 20, flexShrink: 0 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: open ? 'var(--color-teal)' : 'var(--color-border-hover)',
            border: `2px solid ${open ? 'var(--color-teal)' : 'var(--color-border-hover)'}`,
            boxShadow: open ? '0 0 8px var(--color-teal-dim)' : 'none',
            transition: 'all 200ms',
            flexShrink: 0,
          }} />
          {open && <div style={{
            width: 1, flex: 1, background: 'var(--color-border)',
            marginTop: 4,
          }} />}
        </div>

        {/* Header */}
        <div style={{ flex: 1 }}>
          <button onClick={() => setOpen(o => !o)} className="city-header"
            aria-expanded={open}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                {city.toUpperCase()}
              </span>
              <span style={{
                fontSize: 12, color: 'var(--color-text-dim)', marginLeft: 10,
                fontFamily: 'var(--font-mono)',
              }}>
                Day{days.length > 1 ? `s ${startDay}–${endDay}` : ` ${startDay}`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono-cost" style={{ fontSize: 12, color: 'var(--color-amber)' }}>
                ₹{cityTotal.toLocaleString('en-IN')}
              </span>
              <span style={{
                fontSize: 16, color: 'var(--color-text-dim)',
                transform: open ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 200ms', display: 'inline-block',
              }}>⌄</span>
            </div>
          </button>

          {/* Day cards */}
          {open && (
            <div style={{ paddingLeft: 0, animation: 'fade-in 200ms ease-out', marginTop: 4 }}>
              {days.map(day => <DayCard key={day.day} day={day} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Day card ────────────────────────────── */
const DayCard = React.memo(function DayCard({ day }) {
  const slots = [
    { label: 'MORNING',   text: day.morning },
    { label: 'AFTERNOON', text: day.afternoon },
    { label: 'EVENING',   text: day.evening },
  ].filter(s => s.text);

  return (
    <article className="day-card">
      <header style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 12,
      }}>
        <h4 style={{
          fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
          margin: 0,
        }}>
          Day {day.day} — {day.title?.replace(/^Day \d+:?\s*/i, '') || day.city}
        </h4>
        <span className="mono-cost" style={{ fontSize: 12, color: 'var(--color-amber)' }}>
          ₹{day.estimated_cost?.toLocaleString('en-IN')}
        </span>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slots.map(({ label, text }) => (
          <div key={label}>
            <span className="mono-sm" style={{ display: 'block', marginBottom: 3, fontSize: 10 }}>
              {label}
            </span>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
});

/* ── Hotel card ──────────────────────────── */
const HotelCard = React.memo(function HotelCard({ hotel }) {
  const amenities = Array.isArray(hotel.amenities)
    ? hotel.amenities : JSON.parse(hotel.amenities || '[]');

  const stars = Math.floor(hotel.rating || 4);

  return (
    <div className="hotel-card">
      {/* Image placeholder */}
      <div style={{
        width: 72, height: 72, borderRadius: 6, flexShrink: 0,
        background: 'linear-gradient(135deg, var(--color-surface-raised), var(--color-surface))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)',
        border: '1px solid var(--color-border)',
      }}>
        HOTEL
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 8,
        }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
            {hotel.name}
          </h4>
          <span className="mono-cost" style={{
            fontSize: 13, color: 'var(--color-teal)', whiteSpace: 'nowrap',
          }}>
            ₹{hotel.price_per_night?.toLocaleString('en-IN')}/nt
          </span>
        </div>

        <div style={{ margin: '4px 0 8px', fontSize: 13 }}>
          <span style={{ color: 'var(--color-amber)' }}>{'★'.repeat(stars)}</span>
          <span style={{ color: 'var(--color-border-hover)' }}>{'★'.repeat(5 - stars)}</span>
          <span style={{
            color: 'var(--color-text-dim)', marginLeft: 6,
            fontFamily: 'var(--font-mono)', fontSize: 11,
          }}>
            {hotel.rating}/5
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {amenities.slice(0, 4).map(a => (
            <span key={a} className="badge">{a}</span>
          ))}
        </div>

        <a href={hotel.booking_url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue)' }}>
          View & Book →
        </a>
      </div>
    </div>
  );
});

/* ── Transport card ──────────────────────── */
function TransportCard({ route }) {
  return (
    <div className="transport-card">
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
            {route.from}
          </span>
          <span style={{
            flex: 1, height: 1, borderTop: '1px dashed var(--color-border-hover)',
            margin: '0 4px',
          }} />
          <span className="mono-sm" style={{ fontSize: 10 }}>{route.mode}</span>
          <span style={{
            flex: 1, height: 1, borderTop: '1px dashed var(--color-border-hover)',
            margin: '0 4px',
          }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
            {route.to}
          </span>
        </div>
        <div style={{
          fontSize: 12, color: 'var(--color-text-dim)',
          fontFamily: 'var(--font-mono)',
        }}>
          {route.duration}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="mono-cost" style={{ fontSize: 14, color: 'var(--color-teal)' }}>
          ₹{route.cost?.toLocaleString('en-IN')}
        </div>
        {route.booking_url && (
          <a href={route.booking_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--color-blue)', fontWeight: 600 }}>
            Book
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────── */
export default function ItineraryResults({ results, onReset }) {
  const { trip, itinerary = [], hotels = [], transportation = [], budget_breakdown } = results;
  const [saveState, setSaveState] = useState(trip && trip.id ? 'saved' : 'idle');
  const [saveError, setSaveError] = useState('');
  const [savedTripId, setSavedTripId] = useState(trip && trip.id ? trip.id : null);
  const cityGroups = useMemo(() => groupDaysByCity(itinerary), [itinerary]);

  const handleSave = useCallback(async () => {
    setSaveState('saving');
    setSaveError('');
    try {
      const resData = await saveTrip({ trip, itinerary });
      setSavedTripId(resData.tripId);
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      setSaveError(err.response?.data?.error || 'Save failed. Try again?');
    }
  }, [trip, itinerary]);

  const uniqueCities = [...new Set(itinerary.map(d => d.city))];
  const totalDist = itinerary.length;

  return (
    <div style={{ animation: 'slide-up 250ms ease-out' }}>

      {/* ── Route header ── */}
      <div style={{
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 24, marginBottom: 32,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <p className="mono-sm" style={{ marginBottom: 8 }}>Journey Assembled</p>
            <h2 style={{
              fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: 'var(--color-text)', letterSpacing: '-0.5px',
            }}>
              {trip.origin?.toUpperCase()} → {trip.destination?.toUpperCase()}
            </h2>
            <p style={{
              fontSize: 13, color: 'var(--color-text-dim)',
              fontFamily: 'var(--font-mono)', marginTop: 6,
            }}>
              {trip.duration_days} days · {uniqueCities.length} {uniqueCities.length === 1 ? 'city' : 'cities'} · {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''} · ₹{trip.budget?.toLocaleString('en-IN')}
            </p>
            {/* Interest tags */}
            {trip.interests?.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {trip.interests.map(i => (
                  <span key={i} className="badge badge-teal">{i}</span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="no-print" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={onReset} className="btn-ghost">← New Journey</button>
            {saveState === 'error' && (
              <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{saveError}</span>
            )}
            <button onClick={handleSave}
              disabled={saveState === 'saving' || saveState === 'saved'}
              className={saveState === 'saved' ? 'btn-ghost' : 'btn-primary'}
              style={{ minWidth: 110 }}>
              {saveState === 'saved' ? '✓ Saved' : saveState === 'saving' ? 'Saving…' : 'Save Journey'}
            </button>
            <button onClick={() => window.print()} className="btn-amber" style={{ padding: '8px 14px', fontSize: 13 }}>
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {saveState === 'saved' && (
        <div className="no-print" style={{
          background: 'var(--color-teal-dim)',
          border: '1px solid var(--color-teal)',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 24,
          color: 'var(--color-text)',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fade-in 200ms ease-out'
        }}>
          <span style={{ color: 'var(--color-teal)', fontWeight: 'bold' }}>✓</span>
          <span>Journey saved successfully to database! (Trip ID: {savedTripId})</span>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 32, alignItems: 'start',
      }}>
        {/* LEFT: Timeline + hotels + transport */}
        <div>
          {/* Itinerary */}
          <section style={{ marginBottom: 36 }}>
            <p className="mono-sm" style={{ marginBottom: 16 }}>Itinerary</p>
            {cityGroups.length > 0 ? (() => {
              let ctr = 1;
              return cityGroups.map((g, i) => {
                const start = ctr;
                ctr += g.days.length;
                return <CityGroup key={`${g.city}-${i}`} city={g.city}
                  days={g.days} startDay={start} defaultOpen={i === 0} />;
              });
            })() : (
              <p style={{ color: 'var(--color-text-dim)', fontStyle: 'italic' }}>
                No days generated.
              </p>
            )}
          </section>

          {/* Hotels */}
          {hotels.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <p className="mono-sm" style={{ marginBottom: 16 }}>Accommodations</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {hotels.map((h, i) => <HotelCard key={i} hotel={h} />)}
              </div>
            </section>
          )}

          {/* Transport */}
          {transportation.length > 0 && (
            <section>
              <p className="mono-sm" style={{ marginBottom: 16 }}>Routes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transportation.map((r, i) => <TransportCard key={i} route={r} />)}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT: Budget */}
        <div style={{
          position: 'sticky', top: 80,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: 24,
        }}>
          <BudgetBreakdown breakdown={budget_breakdown} userBudget={trip.budget} />
        </div>
      </div>
    </div>
  );
}
