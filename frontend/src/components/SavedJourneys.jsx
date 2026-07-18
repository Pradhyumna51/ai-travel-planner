import React, { useState, useEffect } from 'react';
import { getSavedTrips } from '../services/api';

export default function SavedJourneys({ onSelect }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getSavedTrips();
        setTrips(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load saved journeys.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="mono-sm" style={{ marginBottom: 12 }}>Retrieving Records</div>
        <p style={{ color: 'var(--color-text-dim)', fontSize: 14 }}>Accessing secure database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '40px 20px' }}>
        <div className="alert-error">
          <span>!</span>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p className="mono-sm" style={{ marginBottom: 10 }}>Database Records</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>
          Saved Journeys
        </h1>
      </div>

      {trips.length === 0 ? (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '60px 40px',
          border: '1px dashed var(--color-border)',
          borderRadius: 20,
        }}>
          <p className="mono-sm" style={{ marginBottom: 12 }}>No Records Found</p>
          <p style={{ color: 'var(--color-text-dim)', fontSize: 14, margin: 0 }}>
            You haven't saved any journeys yet. Go assemble a new journey to begin!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {trips.map(trip => {
            const startStr = new Date(trip.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const endStr = new Date(trip.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div key={trip.id} className="glass-card" style={{
                borderRadius: 12,
                padding: '28px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 20,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className="mono-sm" style={{ fontSize: 9, background: 'var(--color-teal-dim)', color: 'var(--color-teal)', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                      TRIP ID: {trip.id}
                    </span>
                    <span style={{ color: 'var(--color-text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {startStr} – {endStr}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px', color: 'var(--color-text)', letterSpacing: '-0.3px', fontFamily: 'var(--font-sans)' }}>
                    {trip.origin?.toUpperCase()} <span style={{ color: 'var(--color-teal)' }}>→</span> {trip.destination?.toUpperCase()}
                  </h3>

                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}><polygon points="12 2 2 22 22 22"/></svg> {trip.duration_days} days</span>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      ₹{trip.budget?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {trip.interests?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {trip.interests.map(i => (
                        <span key={i} className="badge badge-teal" style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4 }}>{i}</span>
                      ))}
                    </div>
                  )}
                </div>

                  <button onClick={() => onSelect(trip.id)} className="btn-primary" style={{ flexShrink: 0, padding: '12px 24px', fontSize: 13, borderRadius: 8 }}>
                  View Itinerary →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
