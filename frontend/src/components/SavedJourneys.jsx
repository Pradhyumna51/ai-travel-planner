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
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
          borderRadius: 8,
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
              <div key={trip.id} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 20,
                transition: 'border-color 200ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className="mono-sm" style={{ fontSize: 10, background: 'var(--color-surface-raised)', padding: '2px 6px', borderRadius: 3 }}>
                      ID: {trip.id}
                    </span>
                    <span style={{ color: 'var(--color-text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      {startStr} – {endStr}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: 'var(--color-text)' }}>
                    {trip.origin?.toUpperCase()} → {trip.destination?.toUpperCase()}
                  </h3>

                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                    <span>{trip.duration_days} days</span>
                    <span>·</span>
                    <span>{trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span style={{ color: 'var(--color-teal)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      ₹{trip.budget?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {trip.interests?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {trip.interests.map(i => (
                        <span key={i} className="badge badge-teal" style={{ fontSize: 10 }}>{i}</span>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => onSelect(trip.id)} className="btn-primary" style={{ flexShrink: 0, padding: '10px 18px', fontSize: 13 }}>
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
