import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper to match maneuver type to arrow or symbol
function getManeuverIcon(maneuver) {
  const m = (maneuver || '').toLowerCase();
  if (m.includes('right')) return '→';
  if (m.includes('left')) return '←';
  if (m.includes('sharp right')) return '⬏';
  if (m.includes('sharp left')) return '⬎';
  if (m.includes('slight right')) return '⬈';
  if (m.includes('slight left')) return '⬉';
  if (m.includes('u-turn')) return '⟲';
  return '↑'; // straight/default
}

export default function RouteDirections({ routeId, fromName, toName, originCoords, destCoords, onClose }) {
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadDirections() {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`http://localhost:5000/api/trips/routes/${routeId}/directions`);
        if (active) {
          setDirections(response.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching directions:', err);
        if (active) {
          setError('Could not load directions. OSRM service might be offline.');
          setLoading(false);
        }
      }
    }

    if (routeId) {
      loadDirections();
    }
    return () => { active = false; };
  }, [routeId]);

  const handleCopy = () => {
    if (!directions) return;
    
    let text = `Directions from ${fromName} to ${toName}:\n`;
    text += `Total Distance: ${(directions.distance_m / 1000).toFixed(2)} km · Time: ${Math.round(directions.duration_s / 60)} mins\n\n`;
    
    // We only have 1 leg in OSRM response if queries are per segment
    directions.legs?.forEach((leg, legIdx) => {
      leg.steps?.forEach((step, stepIdx) => {
        text += `${stepIdx + 1}. ${step.instruction} (${step.distance_m}m)\n`;
      });
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Google Maps directions URL
  const googleMapsUrl = originCoords && destCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&travelmode=walking`
    : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromName)}&destination=${encodeURIComponent(toName)}&travelmode=walking`;

  return (
    <div style={{
      background: 'var(--color-surface-raised)',
      border: '1px solid var(--color-border-hover)',
      borderRadius: 8,
      padding: 20,
      marginTop: 12,
      animation: 'slide-up 200ms ease-out',
      boxShadow: 'var(--shadow-md)',
      position: 'relative'
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-teal)', margin: 0 }}>
            WALKING DIRECTIONS
          </h4>
          <p style={{ fontSize: 11, color: 'var(--color-text-dim)', margin: '2px 0 0' }}>
            {fromName} → {toName}
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-dim)',
          cursor: 'pointer',
          fontSize: 16
        }}>✕</button>
      </header>

      {loading ? (
        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>Calculating path...</span>
        </div>
      ) : error ? (
        <div className="alert-error" style={{ fontSize: 13, padding: '10px 12px' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <div>
              <span style={{ color: 'var(--color-text-dim)' }}>Distance:</span>{' '}
              <strong style={{ color: 'var(--color-amber)' }}>
                {(directions.distance_m / 1000).toFixed(2)} km
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-dim)' }}>Time:</span>{' '}
              <strong style={{ color: 'var(--color-teal)' }}>
                {Math.round(directions.duration_s / 60)} mins
              </strong>
            </div>
          </div>

          <div style={{
            maxHeight: 220,
            overflowY: 'auto',
            paddingRight: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 20
          }}>
            {directions.legs?.[0]?.steps?.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
                <span style={{
                  color: 'var(--color-teal)',
                  fontWeight: 'bold',
                  fontSize: 14,
                  lineHeight: '1.2',
                  display: 'inline-block',
                  width: 14,
                  textAlign: 'center'
                }}>
                  {getManeuverIcon(step.maneuver)}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {step.instruction}
                  </p>
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {step.distance_m}m · {Math.round(step.duration_s)}s
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <button onClick={handleCopy} className="btn-ghost" style={{ flex: 1, padding: '6px 12px', fontSize: 12 }}>
              {copied ? '✓ Copied' : '📋 Copy Text'}
            </button>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: 12,
              textDecoration: 'none',
              color: 'var(--color-bg)'
            }}>
              Google Maps ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
