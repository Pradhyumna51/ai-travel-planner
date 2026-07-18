import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import BudgetBreakdown from './BudgetBreakdown';
import MapContainer from './MapContainer';
import DaySidebar from './DaySidebar';
import { saveTrip, getMapData } from '../services/api';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";

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

/* ── Day card ────────────────────────────── */
const DayCard = React.memo(function DayCard({ day }) {
  const slots = [
    { label: 'MORNING',   text: day.morning },
    { label: 'AFTERNOON', text: day.afternoon },
    { label: 'EVENING',   text: day.evening },
  ].filter(s => s.text);

  return (
    <Card className="day-card p-5 rounded-xl border border-border/40 bg-card mb-3">
      <CardHeader className="flex flex-row justify-between items-start p-0 mb-3 space-y-0 gap-4">
        <CardTitle className="text-sm font-bold text-white tracking-tight">
          Day {day.day} — {day.title?.replace(/^Day \d+:?\s*/i, '') || day.city}
        </CardTitle>
        <span className="mono-cost text-xs text-amber-500 font-mono">
          ₹{day.estimated_cost?.toLocaleString('en-IN')}
        </span>
      </CardHeader>
      <CardContent className="p-0 flex flex-col gap-3">
        {slots.map(({ label, text }) => (
          <div key={label}>
            <span className="mono-sm text-[10px] text-pink-500 font-mono uppercase tracking-wider block mb-1">
              {label}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed margin-0">
              {text}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

/* ── Hotel card ──────────────────────────── */
const HotelCard = React.memo(function HotelCard({ hotel }) {
  const amenities = Array.isArray(hotel.amenities)
    ? hotel.amenities : JSON.parse(hotel.amenities || '[]');

  const stars = Math.floor(hotel.rating || 4);

  return (
    <Card className="hotel-card flex gap-4 p-5 rounded-xl border border-border/40 bg-card">
      <CardContent className="p-0 flex gap-4 w-full">
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
              <Badge key={a} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">{a}</Badge>
            ))}
          </div>

          <a href={hotel.booking_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue)' }}>
            View & Book →
          </a>
        </div>
      </CardContent>
    </Card>
  );
});

/* ── Transport card ──────────────────────── */
function TransportCard({ route }) {
  return (
    <Card className="transport-card p-4 rounded-xl border border-border/40 bg-card flex justify-between items-center gap-4">
      <CardContent className="p-0 flex justify-between items-center w-full gap-4">
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
            <span className="mono-sm text-[10px] font-mono text-pink-500">{route.mode}</span>
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
      </CardContent>
    </Card>
  );
}

/* ── Main ─────────────────────────────────── */
export default function ItineraryResults({ results, onReset }) {
  const { trip, itinerary = [], hotels = [], transportation = [], budget_breakdown } = results;
  const [saveState, setSaveState] = useState(trip && trip.id ? 'saved' : 'idle');
  const [saveError, setSaveError] = useState('');
  const [savedTripId, setSavedTripId] = useState(trip && trip.id ? trip.id : null);
  const cityGroups = useMemo(() => groupDaysByCity(itinerary), [itinerary]);
  const cityGroupsWithDays = useMemo(() => {
    let currentDayIndex = 1;
    return cityGroups.map((g) => {
      const start = currentDayIndex;
      currentDayIndex += g.days.length;
      const end = currentDayIndex - 1;
      const cityTotal = g.days.reduce((s, d) => s + (d.estimated_cost || 0), 0);
      return {
        ...g,
        startDay: start,
        endDay: end,
        cityTotal
      };
    });
  }, [cityGroups]);

  const [activeTab, setActiveTab] = useState('timeline');
  const [mapData, setMapData] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeTab === 'map' && !mapData && (savedTripId || trip?.id)) {
      const idToFetch = savedTripId || trip.id;
      setMapLoading(true);
      setMapError('');
      getMapData(idToFetch)
        .then(data => {
          setMapData(data);
          setMapLoading(false);
        })
        .catch(err => {
          console.error('Error fetching map data:', err);
          setMapError('Failed to load map data. OSRM routing or database issue.');
          setMapLoading(false);
        });
    }
  }, [activeTab, savedTripId, trip?.id, mapData]);

  const handleSave = useCallback(async () => {
    setSaveState('saving');
    setSaveError('');
    try {
      const resData = await saveTrip({ trip, itinerary });
      setSavedTripId(resData.tripId);
      setSaveState('saved');
      setMapData(null); // Reset to force reload on switching to map tab
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
                  <Badge key={i} variant="secondary" className="bg-pink-500/10 text-pink-500 border border-pink-500/20 px-2.5 py-0.5 rounded-full">{i}</Badge>
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
 
      {/* Decorative Animated SVG Path in Header */}
      <div style={{ position: 'relative', height: 40, width: '100%', overflow: 'hidden', marginBottom: -10 }}>
        <svg width="100%" height="40" style={{ pointerEvents: 'none' }}>
          <path
            d="M 10,20 C 150,-10 300,50 450,20 C 600,-10 750,50 900,20 C 1050,-10 1200,50 1350,20"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1.5"
            strokeDasharray="4, 6"
          />
          <path
            d="M 10,20 C 150,-10 300,50 450,20 C 600,-10 750,50 900,20 C 1050,-10 1200,50 1350,20"
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth="1.5"
            strokeDasharray="120"
            strokeDashoffset="120"
            style={{
              animation: 'dash-path 15s linear infinite'
            }}
          />
        </svg>
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
 
      {/* Tab Selector */}
      <Tabs defaultValue="timeline" value={activeTab} onValueChange={setActiveTab} className="w-full no-print mb-6">
        <TabsList className="flex gap-4 border-b border-border/40 bg-transparent p-0 rounded-none h-10">
          <TabsTrigger value="timeline" className="px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:text-pink-500 rounded-none bg-transparent hover:text-white transition-all">
            TIMELINE DETAILS
          </TabsTrigger>
          <TabsTrigger value="map" className="px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:text-pink-500 rounded-none bg-transparent hover:text-white transition-all">
            INTERACTIVE MAPS
          </TabsTrigger>
        </TabsList>
      </Tabs>
 
      {activeTab === 'timeline' ? (
        /* ── Two-column layout ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 32, alignItems: 'start',
        }}>
          {/* LEFT: Timeline + hotels + transport */}
          <div>
            {/* Itinerary */}
            <section style={{ marginBottom: 36 }}>
              <p className="mono-sm text-[10px] text-pink-500 font-mono uppercase tracking-wider block mb-4">Itinerary</p>
              {cityGroupsWithDays.length > 0 ? (
                <Accordion type="single" collapsible defaultValue="city-0" className="w-full">
                  {cityGroupsWithDays.map((g, idx) => (
                    <AccordionItem key={idx} value={`city-${idx}`} className="border-none mb-3">
                      <div className="flex gap-3">
                        {/* Node indicator */}
                        <div className="flex flex-col items-center pt-3.5 w-5 shrink-0">
                          <div className="size-2 rounded-full bg-pink-500 border-2 border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.3)] shrink-0" />
                          <div className="w-[1px] flex-1 bg-border/40 mt-1" />
                        </div>
 
                        <div className="flex-1">
                          <AccordionTrigger className="city-header flex justify-between items-center py-2.5 hover:no-underline w-full border-none cursor-pointer">
                            <div className="flex items-center text-left">
                              <span className="font-bold text-sm text-white">{g.city.toUpperCase()}</span>
                              <span className="text-xs text-slate-400 font-mono ml-2.5">
                                Day{g.days.length > 1 ? `s ${g.startDay}–${g.endDay}` : ` ${g.startDay}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="mono-cost text-xs text-amber-500 font-mono mr-5">
                                ₹{g.cityTotal.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-0">
                            <div className="flex flex-col gap-2 animation-fade-in">
                              {g.days.map(day => <DayCard key={day.day} day={day} />)}
                            </div>
                          </AccordionContent>
                        </div>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p style={{ color: 'var(--color-text-dim)', fontStyle: 'italic' }}>
                  No days generated.
                </p>
              )}
            </section>
 
            {/* Hotels */}
            {hotels.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <p className="mono-sm text-[10px] text-pink-500 font-mono uppercase tracking-wider block mb-4">Accommodations</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {hotels.map((h, i) => <HotelCard key={i} hotel={h} />)}
                </div>
              </section>
            )}
 
            {/* Transport */}
            {transportation.length > 0 && (
              <section>
                <p className="mono-sm text-[10px] text-pink-500 font-mono uppercase tracking-wider block mb-4">Routes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {transportation.map((r, i) => <TransportCard key={i} route={r} />)}
                </div>
              </section>
            )}
          </div>
 
          {/* RIGHT: Budget */}
          <Card className="glass-card border-none sticky top-[84px] p-6">
            <BudgetBreakdown breakdown={budget_breakdown} userBudget={trip.budget} />
          </Card>
        </div>
      ) : (
        /* ── Map layout ── */
        <div>
          {saveState !== 'saved' ? (
            <Card className="glass-card max-w-[580px] mx-auto my-[30px] p-10 py-14 text-center border border-pink-500/25 shadow-[0_12px_40px_0_rgba(0,0,0,0.4),0_0_20px_rgba(236,72,153,0.08)]">
              <CardContent className="p-0">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{
                    background: 'var(--color-teal-dim)',
                    borderRadius: '50%',
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px var(--color-teal-dim)'
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                      <line x1="9" y1="3" x2="9" y2="18" />
                      <line x1="15" y1="6" x2="15" y2="21" />
                    </svg>
                  </div>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: 'var(--color-text)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.3px' }}>
                  Unlock Interactive Maps & Walking Trails
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
                  Save this journey to geocode daily sights, order attractions using route optimization, and see step-by-step walking directions.
                </p>
                <button onClick={handleSave} className="btn-primary" disabled={saveState === 'saving'} style={{ padding: '12px 32px', fontSize: 14 }}>
                  {saveState === 'saving' ? 'Saving Journey…' : '✓ Save Journey to Unlock'}
                </button>
              </CardContent>
            </Card>
          ) : mapLoading ? (
            <div style={{ padding: '100px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Loader variant="wave" size="lg" className="text-pink-500" />
              <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                GEOLOCATING SIGHTS & OPTIMIZING WALKING PATHS...
              </span>
            </div>
          ) : mapError ? (
            <div className="alert-error" style={{ margin: '20px 0', padding: 20 }}>
              <span>⚠️</span>
              <span>{mapError}</span>
            </div>
          ) : mapData ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
              height: isMobile ? 'auto' : '650px',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              overflow: 'hidden',
              background: 'var(--color-bg)',
              animation: 'fade-in 400ms ease-out'
            }}>
              <div style={{ flex: 1, height: isMobile ? '350px' : '100%' }}>
                <MapContainer
                  mapData={mapData}
                  selectedDay={selectedDay}
                  selectedAttraction={selectedAttraction}
                  onAttractionSelect={setSelectedAttraction}
                />
              </div>
              <div style={{ width: isMobile ? '100%' : 360, height: isMobile ? '450px' : '100%' }}>
                <DaySidebar
                  mapData={mapData}
                  selectedDay={selectedDay}
                  onDaySelect={setSelectedDay}
                  selectedAttraction={selectedAttraction}
                  onAttractionSelect={setSelectedAttraction}
                />
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-dim)', fontStyle: 'italic', textAlign: 'center', padding: 40 }}>
              No map data found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
