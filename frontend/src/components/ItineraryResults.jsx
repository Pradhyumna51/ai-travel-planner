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
import { Plane, Calendar, Users, Briefcase, Printer, Download, Map, Sparkles, Building, Car, ArrowRight, ArrowLeft } from 'lucide-react';

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
    { label: 'MORNING',   text: day.morning, color: '#38bdf8' },
    { label: 'AFTERNOON', text: day.afternoon, color: '#f59e0b' },
    { label: 'EVENING',   text: day.evening, color: '#ec4899' },
  ].filter(s => s.text);

  return (
    <Card className="day-card p-5 rounded-xl border border-border/40 bg-card mb-3 relative overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-start p-0 mb-4 space-y-0 gap-4">
        <CardTitle className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <span style={{
            background: 'var(--color-teal-dim)',
            color: 'var(--color-teal)',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'var(--font-mono)'
          }}>Day {day.day}</span>
          <span>{day.title?.replace(/^Day \d+:?\s*/i, '') || day.city}</span>
        </CardTitle>
        <span className="mono-cost text-sm text-amber-500 font-mono font-bold">
          ₹{day.estimated_cost?.toLocaleString('en-IN')}
        </span>
      </CardHeader>
      <CardContent className="p-0 flex flex-col gap-4">
        {slots.map(({ label, text, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.015)',
            padding: '10px 14px',
            borderRadius: 8,
            borderLeft: `2.5px solid ${color}`
          }}>
            <span className="mono-sm text-[9px] font-mono uppercase tracking-wider block mb-1" style={{ color }}>
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
      <CardContent className="p-0 flex gap-4 w-full items-center">
        {/* Image placeholder */}
        <div style={{
          width: 80, height: 80, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(139,92,246,0.15) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-teal)',
          border: '1px solid rgba(236, 72, 153, 0.25)',
          boxShadow: 'inset 0 0 10px rgba(236,72,153,0.1)'
        }}>
          <Building className="size-8 animate-pulse" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', gap: 8,
          }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
              {hotel.name}
            </h4>
            <span className="mono-cost" style={{
              fontSize: 14, color: 'var(--color-teal)', whiteSpace: 'nowrap', fontWeight: 'bold'
            }}>
              ₹{hotel.price_per_night?.toLocaleString('en-IN')}/nt
            </span>
          </div>

          <div style={{ margin: '4px 0 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--color-amber)' }}>{'★'.repeat(stars)}</span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>{'★'.repeat(5 - stars)}</span>
            <span style={{
              color: 'var(--color-text-dim)',
              fontFamily: 'var(--font-mono)', fontSize: 10,
            }}>
              ({hotel.rating}/5)
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {amenities.slice(0, 4).map(a => (
              <Badge key={a} variant="secondary" className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300 font-sans">{a}</Badge>
            ))}
          </div>

          <a href={hotel.booking_url} target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 12, fontWeight: 700, color: 'var(--color-teal)',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              textDecoration: 'none'
            }}>
            View & Book <ArrowRight className="size-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
});

/* ── Transport card ──────────────────────── */
function TransportCard({ route }) {
  const getIcon = (mode) => {
    const m = mode.toLowerCase();
    if (m.includes('flight') || m.includes('air')) return <Plane className="size-5" />;
    return <Car className="size-5" />;
  };

  return (
    <Card className="transport-card p-5 rounded-xl border border-border/40 bg-card flex justify-between items-center gap-4">
      <CardContent className="p-0 flex justify-between items-center w-full gap-4">
        {/* Icon wrapper */}
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: 'rgba(167, 139, 250, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-lavender)',
          border: '1px solid rgba(167, 139, 250, 0.2)',
          flexShrink: 0
        }}>
          {getIcon(route.mode)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
          }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {route.from}
            </span>
            <span style={{
              flex: 1, height: 1, borderTop: '2px dashed var(--color-border-hover)',
              margin: '0 4px',
            }} />
            <span className="mono-sm text-[9px] font-mono text-pink-500 uppercase tracking-widest px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/10">{route.mode}</span>
            <span style={{
              flex: 1, height: 1, borderTop: '2px dashed var(--color-border-hover)',
              margin: '0 4px',
            }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {route.to}
            </span>
          </div>
          <div style={{
            fontSize: 11, color: 'var(--color-text-dim)',
            fontFamily: 'var(--font-mono)',
          }}>
            🕒 {route.duration}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="mono-cost text-sm font-bold" style={{ color: 'var(--color-teal)' }}>
            ₹{route.cost?.toLocaleString('en-IN')}
          </div>
          {route.booking_url && (
            <a href={route.booking_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: 'var(--color-blue)', fontWeight: 700, textDecoration: 'none' }}>
              Book Travel →
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span className="mono-sm text-pink-500 font-bold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles className="size-3.5" /> Journey Assembled
              </span>
            </div>
            <h2 style={{
              fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-sans)',
              color: 'var(--color-text)', letterSpacing: '-0.5px',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              {trip.origin?.toUpperCase()} 
              <ArrowRight className="size-6 text-pink-500" /> 
              {trip.destination?.toUpperCase()}
            </h2>
            
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center',
              marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar className="size-4 text-slate-400" /> {trip.duration_days} days
              </span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building className="size-4 text-slate-400" /> {uniqueCities.length} {uniqueCities.length === 1 ? 'city' : 'cities'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users className="size-4 text-slate-400" /> {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-teal)' }}>
                ₹{trip.budget?.toLocaleString('en-IN')} Limit
              </span>
            </div>

            {/* Interest tags */}
            {trip.interests?.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {trip.interests.map(i => (
                  <Badge key={i} variant="secondary" className="bg-pink-500/10 text-pink-500 border border-pink-500/20 px-2.5 py-1 rounded-md text-[10px] uppercase font-mono font-bold tracking-wider">{i}</Badge>
                ))}
              </div>
            )}
          </div>
 
          {/* Actions */}
          <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={onReset} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
              <ArrowLeft className="size-4" /> New Plan
            </button>
            {saveState === 'error' && (
              <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>{saveError}</span>
            )}
            <button onClick={handleSave}
              disabled={saveState === 'saving' || saveState === 'saved'}
              className={saveState === 'saved' ? 'btn-ghost' : 'btn-primary'}
              style={{ minWidth: 120, borderRadius: 10, fontWeight: 700 }}>
              {saveState === 'saved' ? '✓ Saved' : saveState === 'saving' ? 'Saving…' : 'Save Plan'}
            </button>
            <button onClick={() => window.print()} className="btn-amber" style={{ padding: '10px 16px', fontSize: 13, borderRadius: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer className="size-4" /> PDF
            </button>
          </div>
        </div>
      </div>
 
      {/* Decorative Animated SVG Path in Header */}
      <div style={{ position: 'relative', height: 40, width: '100%', overflow: 'hidden', marginBottom: 12 }}>
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
          background: 'rgba(236, 72, 153, 0.08)',
          border: '1px solid rgba(236, 72, 153, 0.25)',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 28,
          color: 'var(--color-text)',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fade-in 200ms ease-out',
          boxShadow: '0 0 16px rgba(236, 72, 153, 0.04)'
        }}>
          <span style={{ color: 'var(--color-teal)', fontWeight: 'bold', fontSize: 16 }}>✓</span>
          <span>Journey saved successfully! Click the <strong>Interactive Maps</strong> tab below to view optimised paths and directions.</span>
        </div>
      )}
  
      <Tabs defaultValue="timeline" value={activeTab} onValueChange={setActiveTab} className="w-full no-print mb-8">
        <TabsList className="flex gap-2 border-b border-border bg-transparent p-0 rounded-none h-12">
          <TabsTrigger value="timeline" className="px-6 py-3 text-xs font-mono font-bold tracking-widest uppercase border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:text-pink-500 rounded-none bg-transparent hover:text-white transition-all">
            TIMELINE DETAILS
          </TabsTrigger>
          <TabsTrigger value="map" className="px-6 py-3 text-xs font-mono font-bold tracking-widest uppercase border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:text-pink-500 rounded-none bg-transparent hover:text-white transition-all">
            INTERACTIVE MAPS
          </TabsTrigger>
        </TabsList>
      </Tabs>
  
      {activeTab === 'timeline' ? (
        /* ── Two-column layout ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
          gap: isMobile ? 24 : 36, alignItems: 'start',
        }}>
          {/* LEFT: Timeline + hotels + transport */}
          <div>
            {/* Itinerary */}
            <section style={{ marginBottom: 40 }}>
              <p className="mono-sm text-[10px] text-pink-500 font-mono font-bold uppercase tracking-wider block mb-5">Chronological Itinerary</p>
              {cityGroupsWithDays.length > 0 ? (
                <Accordion type="single" collapsible defaultValue="city-0" className="w-full">
                  {cityGroupsWithDays.map((g, idx) => (
                    <AccordionItem key={idx} value={`city-${idx}`} className="border-none mb-4">
                      <div className="flex gap-4">
                        {/* Node indicator */}
                        <div className="flex flex-col items-center pt-3 w-6 shrink-0">
                          <div className="size-3 rounded-full bg-pink-500 border-2 border-background shadow-[0_0_10px_rgba(236,72,153,0.5)] shrink-0" />
                          <div className="w-[2px] flex-1 bg-gradient-to-b from-pink-500/30 to-transparent mt-2" />
                        </div>
  
                        <div className="flex-1">
                          <AccordionTrigger className="city-header flex justify-between items-center py-3 px-4 hover:no-underline w-full border border-border bg-white/2 rounded-xl cursor-pointer">
                            <div className="flex items-center text-left">
                              <span className="font-extrabold text-sm text-white tracking-wide">{g.city.toUpperCase()}</span>
                              <span className="text-xs text-slate-400 font-mono ml-3 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                                Day{g.days.length > 1 ? `s ${g.startDay}–${g.endDay}` : ` ${g.startDay}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="mono-cost text-xs text-amber-500 font-mono font-bold">
                                ₹{g.cityTotal.toLocaleString('en-IN')} Spent
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-3 pb-0">
                            <div className="flex flex-col gap-3 animation-fade-in">
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
              <section style={{ marginBottom: 40 }}>
                <p className="mono-sm text-[10px] text-pink-500 font-mono font-bold uppercase tracking-wider block mb-5">Accommodations Booking Options</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {hotels.map((h, i) => <HotelCard key={i} hotel={h} />)}
                </div>
              </section>
            )}
  
            {/* Transport */}
            {transportation.length > 0 && (
              <section>
                <p className="mono-sm text-[10px] text-pink-500 font-mono font-bold uppercase tracking-wider block mb-5">Travel Connections & Transit</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {transportation.map((r, i) => <TransportCard key={i} route={r} />)}
                </div>
              </section>
            )}
          </div>
  
          {/* RIGHT: Budget */}
          <Card className="glass-card border border-pink-500/10 md:sticky md:top-[84px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] rounded-2xl">
            <BudgetBreakdown breakdown={budget_breakdown} userBudget={trip.budget} />
          </Card>
        </div>
      ) : (
        /* ── Map layout ── */
        <div>
          {saveState !== 'saved' ? (
            <Card className="glass-card max-w-[580px] mx-auto my-[30px] p-10 py-14 text-center border border-pink-500/25 shadow-[0_12px_40px_0_rgba(0,0,0,0.4),0_0_20px_rgba(236,72,153,0.08)] rounded-2xl">
              <CardContent className="p-0">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{
                    background: 'rgba(236, 72, 153, 0.1)',
                    borderRadius: '50%',
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(236, 72, 153, 0.25)',
                    boxShadow: '0 0 15px rgba(236,72,153,0.15)'
                  }}>
                    <Map className="size-9 text-pink-500 animate-bounce" />
                  </div>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: 'var(--color-text)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.3px' }}>
                  Unlock Interactive Maps & Walking Trails
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
                  Save this journey to geocode daily sights, order attractions using route optimization, and see step-by-step walking directions.
                </p>
                <button onClick={handleSave} className="btn-primary" disabled={saveState === 'saving'} style={{ padding: '12px 32px', fontSize: 14, borderRadius: 10, fontWeight: 700 }}>
                  {saveState === 'saving' ? 'Saving Journey…' : '✓ Save Journey to Unlock'}
                </button>
              </CardContent>
            </Card>
          ) : mapLoading ? (
            <div style={{ padding: '120px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Loader variant="wave" size="lg" className="text-pink-500" />
              <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontWeight: 'bold' }}>
                GEOLOCATING SIGHTS & OPTIMIZING WALKING PATHS...
              </span>
            </div>
          ) : mapError ? (
            <div className="alert-error" style={{ margin: '20px 0', padding: 20, borderRadius: 10 }}>
              <span>⚠️</span>
              <span>{mapError}</span>
            </div>
          ) : mapData ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
              height: isMobile ? 'auto' : '680px',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              overflow: 'hidden',
              background: 'var(--color-bg)',
              animation: 'fade-in 400ms ease-out',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>
              <div style={{ flex: 1, height: isMobile ? '380px' : '100%' }}>
                <MapContainer
                  mapData={mapData}
                  selectedDay={selectedDay}
                  selectedAttraction={selectedAttraction}
                  onAttractionSelect={setSelectedAttraction}
                />
              </div>
              <div style={{ width: isMobile ? '100%' : 380, height: isMobile ? '480px' : '100%' }}>
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
