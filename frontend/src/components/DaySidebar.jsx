import React, { useState } from 'react';
import RouteDirections from './RouteDirections';

const categoryColors = {
  Food: '#ef4444', // red
  Photography: '#3b82f6', // blue
  History: '#8b5cf6', // purple
  Nature: '#10b981', // green
  Anime: '#ec4899', // pink
  Nightlife: '#f59e0b', // amber
  Shopping: '#06b6d4', // cyan
  Adventure: '#6366f1', // indigo
  Trekking: '#14b8a6', // teal
  Hotel: '#374151', // dark gray
  default: '#6b7280' // gray
};

const dayColors = [
  '#3b82f6', // day 1 - blue
  '#8b5cf6', // day 2 - purple
  '#ef4444', // day 3 - red
  '#f59e0b', // day 4 - amber
  '#10b981', // day 5 - green
  '#06b6d4', // day 6 - cyan
  '#ec4899', // day 7 - pink
  '#6366f1', // day 8 - indigo
  '#14b8a6', // day 9 - teal
  '#f97316', // day 10 - orange
];

export default function DaySidebar({ mapData, selectedDay, onDaySelect, selectedAttraction, onAttractionSelect }) {
  const [activeRouteDirId, setActiveRouteDirId] = useState(null);
  const [activeLegMeta, setActiveLegMeta] = useState(null);

  if (!mapData || !mapData.days) return null;

  const currentDayData = mapData.days.find(d => d.day_number === selectedDay) || mapData.days[0];
  const totalDays = mapData.days.length;

  const handleToggleDirections = (leg, fromCoords, toCoords) => {
    if (activeRouteDirId === leg.id) {
      setActiveRouteDirId(null);
      setActiveLegMeta(null);
    } else {
      setActiveRouteDirId(leg.id);
      setActiveLegMeta({
        fromName: leg.from,
        toName: leg.to,
        originCoords: fromCoords,
        destCoords: toCoords
      });
    }
  };

  return (
    <div className="glass" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderLeft: '1px solid var(--color-border)',
      color: 'var(--color-text)'
    }}>
      {/* Horizontal Day Selector */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        display: 'flex',
        gap: 8,
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none' // IE/Edge
      }} className="no-scrollbar">
        {mapData.days.map(d => {
          const isSelected = d.day_number === selectedDay;
          const routeColor = dayColors[(d.day_number - 1) % dayColors.length];
          return (
            <button
              key={d.day_number}
              onClick={() => {
                onDaySelect(d.day_number);
                setActiveRouteDirId(null);
                setActiveLegMeta(null);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                border: isSelected ? `1px solid ${routeColor}` : '1px solid var(--color-border)',
                background: isSelected ? `${routeColor}20` : 'transparent',
                color: isSelected ? routeColor : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 200ms ease-out',
                flexShrink: 0
              }}
            >
              Day {d.day_number}
            </button>
          );
        })}
      </div>

      {/* Day Summary */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.01)',
        borderBottom: '1px solid var(--color-border)',
        animation: 'fade-in 300ms ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-sans)', color: 'var(--color-text)' }}>
            {currentDayData.city.toUpperCase()}
          </h3>
          <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            {currentDayData.date}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          padding: 12,
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11
        }}>
          <div>
            <span style={{ color: 'var(--color-text-dim)', display: 'block', marginBottom: 2 }}>WALK DIST</span>
            <strong style={{ color: 'var(--color-amber)', fontSize: 13 }}>{currentDayData.summary.walking_km} km</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-dim)', display: 'block', marginBottom: 2 }}>WALK TIME</span>
            <strong style={{ color: 'var(--color-teal)', fontSize: 13 }}>{currentDayData.summary.walking_time_min} mins</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-dim)', display: 'block', marginBottom: 2 }}>ATTRACTIONS</span>
            <strong style={{ color: 'var(--color-text)', fontSize: 13 }}>{currentDayData.summary.attraction_count} sites</strong>
          </div>
        </div>
      </div>

      {/* Attractions List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Starting Hotel Base Card */}
        {currentDayData.route?.waypoints?.[0] && (
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            opacity: 0.85
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 24
            }}>
              <div style={{
                background: '#0f172a',
                color: '#ec4899',
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                boxShadow: '0 0 0 2px #ec4899',
                fontWeight: 'bold',
                zIndex: 2
              }}>
                H
              </div>
              <div style={{
                width: 2,
                height: 40,
                background: 'dashed var(--color-border)',
                borderLeft: '2px dashed var(--color-border-hover)',
                marginTop: 4,
                zIndex: 1
              }} />
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <span className="mono-sm" style={{ fontSize: 9, display: 'block', marginBottom: 2 }}>
                STARTING LOCATION · 09:00 AM
              </span>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                {currentDayData.route.waypoints[0].name}
              </h4>
            </div>
          </div>
        )}

        {/* Attractions Loop */}
        {currentDayData.attractions.map((attr, idx) => {
          const isSelected = selectedAttraction && selectedAttraction.name === attr.name;
          const routeColor = dayColors[(selectedDay - 1) % dayColors.length];
          
          // Locate the OSRM leg leading to this attraction
          const leg = currentDayData.route?.legs?.[idx];
          
          // Previous location coordinates for directions API
          const prevWp = currentDayData.route?.waypoints?.[idx]; // index idx is previous because waypoints array has Hotel at 0
          const currWp = currentDayData.route?.waypoints?.[idx + 1];

          // Determine slot title (Morning, Afternoon, Evening)
          const slots = ['MORNING', 'AFTERNOON', 'EVENING'];
          const slotLabel = slots[idx] || 'SIGHTSEEING';

          return (
            <div key={attr.id} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Walking connector segment */}
              {idx > 0 && leg && (
                <div style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  paddingLeft: 12,
                  margin: '-4px 0 8px',
                  color: 'var(--color-text-dim)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div style={{
                    width: 2,
                    height: 24,
                    borderLeft: `2px dashed ${routeColor}40`,
                    marginLeft: -2
                  }} />
                  <button 
                    onClick={() => handleToggleDirections(leg, prevWp, currWp)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-dim)',
                      cursor: 'pointer',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-teal)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-dim)'}
                  >
                    👣 Walk {(leg.distance_m / 1000).toFixed(1)} km (~{leg.walking_time_min} mins)
                    <span style={{ fontSize: 8 }}>{activeRouteDirId === leg.id ? '▴ Hide' : '▾ Directions'}</span>
                  </button>
                </div>
              )}

              {/* First walking connector from hotel */}
              {idx === 0 && leg && (
                <div style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  paddingLeft: 12,
                  margin: '-12px 0 8px',
                  color: 'var(--color-text-dim)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div style={{
                    width: 2,
                    height: 24,
                    borderLeft: `2px dashed ${routeColor}40`,
                    marginLeft: -2
                  }} />
                  <button 
                    onClick={() => handleToggleDirections(leg, prevWp, currWp)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-dim)',
                      cursor: 'pointer',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-teal)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-dim)'}
                  >
                    👣 Walk {(leg.distance_m / 1000).toFixed(1)} km (~{leg.walking_time_min} mins)
                    <span style={{ fontSize: 8 }}>{activeRouteDirId === leg.id ? '▴ Hide' : '▾ Directions'}</span>
                  </button>
                </div>
              )}

              {/* Attraction card */}
              <div 
                onClick={() => onAttractionSelect(attr)}
                style={{
                  background: isSelected ? 'var(--color-surface-raised)' : 'transparent',
                  border: isSelected ? `1px solid ${routeColor}` : '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 200ms ease-out',
                  display: 'flex',
                  gap: 12,
                  position: 'relative',
                  zIndex: 2,
                  boxShadow: isSelected ? `0 4px 12px ${routeColor}10` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {/* Numbered Category Pin */}
                <div style={{
                  background: categoryColors[attr.category] || categoryColors.default,
                  color: 'white',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  {idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {attr.name}
                    </h4>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', whiteSpace: 'nowrap' }}>
                      {attr.arrival_time}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: categoryColors[attr.category] || '#2dd4bf',
                      background: (categoryColors[attr.category] || '#2dd4bf') + '15',
                      padding: '1px 5px',
                      borderRadius: 2,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {attr.category}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {attr.duration_minutes}m stay
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {attr.description || 'Sightseeing around the venue.'}
                  </p>
                </div>
              </div>

              {/* Inline Directions drawer */}
              {activeRouteDirId && leg && activeLegMeta && prevWp && currWp && currWp.name === attr.name && (
                <div style={{ margin: '8px 0' }}>
                  <RouteDirections
                    routeId={activeRouteDirId}
                    fromName={activeLegMeta.fromName}
                    toName={activeLegMeta.toName}
                    originCoords={activeLegMeta.originCoords}
                    destCoords={activeLegMeta.destCoords}
                    onClose={() => {
                      setActiveRouteDirId(null);
                      setActiveLegMeta(null);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Ending Hotel Base Card (Roundtrip Return) */}
        {currentDayData.route?.waypoints?.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Final walking leg to Hotel */}
            {(() => {
              const len = currentDayData.route.waypoints.length;
              const hotelWp = currentDayData.route.waypoints[len - 1];
              const prevWp = currentDayData.route.waypoints[len - 2];
              const legIdx = currentDayData.route.legs?.length - 1;
              const leg = currentDayData.route?.legs?.[legIdx];
              const routeColor = dayColors[(selectedDay - 1) % dayColors.length];

              if (!leg) return null;

              return (
                <>
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    paddingLeft: 12,
                    margin: '-4px 0 8px',
                    color: 'var(--color-text-dim)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <div style={{
                      width: 2,
                      height: 24,
                      borderLeft: `2px dashed ${routeColor}40`,
                      marginLeft: -2
                    }} />
                    <button 
                      onClick={() => handleToggleDirections(leg, prevWp, hotelWp)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-dim)',
                        cursor: 'pointer',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0
                      }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--color-teal)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--color-text-dim)'}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }}><circle cx="12" cy="5" r="1"/><path d="m9 22 2-6 2-3 2.5 1.5"/><path d="m14 15-2-4-3 1-1.5 3"/></svg> Walk {(leg.distance_m / 1000).toFixed(1)} km (~{leg.walking_time_min} mins)
                      <span style={{ fontSize: 8 }}>{activeRouteDirId === leg.id ? '▴ Hide' : '▾ Directions'}</span>
                    </button>
                  </div>
                  
                  {activeRouteDirId === leg.id && activeLegMeta && (
                    <div style={{ margin: '8px 0' }}>
                      <RouteDirections
                        routeId={activeRouteDirId}
                        fromName={activeLegMeta.fromName}
                        toName={activeLegMeta.toName}
                        originCoords={activeLegMeta.originCoords}
                        destCoords={activeLegMeta.destCoords}
                        onClose={() => {
                          setActiveRouteDirId(null);
                          setActiveLegMeta(null);
                        }}
                      />
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    opacity: 0.85
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: 24
                    }}>
                      <div style={{
                        background: '#0f172a',
                        color: '#ec4899',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        boxShadow: '0 0 0 2px #ec4899',
                        fontWeight: 'bold',
                        zIndex: 2
                      }}>
                        H
                      </div>
                    </div>
                    <div style={{ flex: 1, paddingTop: 2 }}>
                      <span className="mono-sm" style={{ fontSize: 9, display: 'block', marginBottom: 2 }}>
                        RETURN TO HOTEL BASE · {currentDayData.summary.estimated_end_time}
                      </span>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                        {hotelWp.name}
                      </h4>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
