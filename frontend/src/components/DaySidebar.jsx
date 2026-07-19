import React, { useState } from 'react';
import RouteDirections from './RouteDirections';
import { Footprints, Clock, MapPin, Landmark, ArrowRight, Eye, ChevronRight, Compass } from 'lucide-react';

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
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                border: isSelected ? `1.5px solid ${routeColor}` : '1px solid var(--color-border)',
                background: isSelected ? `${routeColor}20` : 'rgba(255,255,255,0.02)',
                color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                boxShadow: isSelected ? `0 0 12px ${routeColor}25` : 'none',
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

      {/* Day Summary Stats Grid */}
      <div style={{
        padding: '18px 20px',
        background: 'rgba(255, 255, 255, 0.005)',
        borderBottom: '1px solid var(--color-border)',
        animation: 'fade-in 300ms ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-sans)', color: 'var(--color-text)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Compass className="size-4.5 text-pink-500 animate-spin-slow" /> {currentDayData.city.toUpperCase()}
          </h3>
          <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', fontWeight: 600, background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 4 }}>
            {currentDayData.date}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          padding: 12,
          background: 'rgba(15, 12, 30, 0.35)',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
          fontFamily: 'var(--font-sans)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--color-text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>
              <Footprints className="size-3 text-amber-500" /> Walk Dist
            </span>
            <strong style={{ color: 'var(--color-amber)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{currentDayData.summary.walking_km} km</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--color-text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>
              <Clock className="size-3 text-pink-500" /> Walk Time
            </span>
            <strong style={{ color: 'var(--color-teal)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{currentDayData.summary.walking_time_min} min</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--color-text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>
              <Landmark className="size-3 text-sky-400" /> Attractions
            </span>
            <strong style={{ color: '#38bdf8', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{currentDayData.summary.attraction_count} sites</strong>
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
      }} className="no-scrollbar">
        
        {/* Starting Hotel Base Card */}
        {currentDayData.route?.waypoints?.[0] && (
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            opacity: 0.9
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
                zIndex: 2,
                fontFamily: 'var(--font-mono)'
              }}>
                H
              </div>
              <div style={{
                width: 2,
                height: 36,
                borderLeft: '2px dashed rgba(236, 72, 153, 0.25)',
                marginTop: 4,
                zIndex: 1
              }} />
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <span className="mono-sm text-[9px] text-pink-500 font-bold" style={{ display: 'block', marginBottom: 2, letterSpacing: '0.8px' }}>
                STARTING AT BASE · 09:00 AM
              </span>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
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

          return (
            <div key={attr.id} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Walking connector segment */}
              {leg && (
                <div style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  paddingLeft: 12,
                  margin: idx === 0 ? '-14px 0 10px' : '-6px 0 10px',
                  color: 'var(--color-text-dim)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div style={{
                    width: 2,
                    height: 28,
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
                      padding: 0,
                      fontFamily: 'var(--font-mono)'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-teal)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-dim)'}
                  >
                    👣 Walk {(leg.distance_m / 1000).toFixed(1)} km (~{leg.walking_time_min} min)
                    <span style={{ fontSize: 8, opacity: 0.8 }}>{activeRouteDirId === leg.id ? '▴ Hide' : '▾ Directions'}</span>
                  </button>
                </div>
              )}

              {/* Attraction card */}
              <div 
                onClick={() => onAttractionSelect(attr)}
                style={{
                  background: isSelected ? 'rgba(236, 72, 153, 0.08)' : 'rgba(15, 12, 30, 0.25)',
                  border: isSelected ? `1.5px solid ${routeColor}` : '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  gap: 12,
                  position: 'relative',
                  zIndex: 2,
                  boxShadow: isSelected ? `0 4px 16px ${routeColor}20` : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'none'
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
                  marginTop: 2,
                  boxShadow: `0 0 10px ${(categoryColors[attr.category] || categoryColors.default)}40`
                }}>
                  {idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {attr.name}
                    </h4>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', fontWeight: 'bold' }}>
                      {attr.arrival_time}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: categoryColors[attr.category] || '#2dd4bf',
                      background: (categoryColors[attr.category] || '#2dd4bf') + '15',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                      border: `1px solid ${(categoryColors[attr.category] || '#2dd4bf')}20`
                    }}>
                      {attr.category}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock className="size-3 text-slate-400" /> {attr.duration_minutes}m stay
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {attr.description || 'Sightseeing around the venue.'}
                  </p>
                </div>
              </div>

              {/* Inline Directions drawer */}
              {activeRouteDirId && leg && activeLegMeta && prevWp && currWp && currWp.name === attr.name && (
                <div style={{ margin: '8px 0', animation: 'slide-up 200ms ease-out' }}>
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
                    margin: '-6px 0 10px',
                    color: 'var(--color-text-dim)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <div style={{
                      width: 2,
                      height: 28,
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
                        padding: 0,
                        fontFamily: 'var(--font-mono)'
                      }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--color-teal)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--color-text-dim)'}
                    >
                      👣 Walk {(leg.distance_m / 1000).toFixed(1)} km (~{leg.walking_time_min} min)
                      <span style={{ fontSize: 8, opacity: 0.8 }}>{activeRouteDirId === leg.id ? '▴ Hide' : '▾ Directions'}</span>
                    </button>
                  </div>
                  
                  {activeRouteDirId === leg.id && activeLegMeta && (
                    <div style={{ margin: '8px 0', animation: 'slide-up 200ms ease-out' }}>
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
                    opacity: 0.9
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
                        zIndex: 2,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        H
                      </div>
                    </div>
                    <div style={{ flex: 1, paddingTop: 2 }}>
                      <span className="mono-sm text-[9px] text-pink-500 font-bold" style={{ display: 'block', marginBottom: 2, letterSpacing: '0.8px' }}>
                        RETURN TO HOTEL BASE · {currentDayData.summary.estimated_end_time}
                      </span>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
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
