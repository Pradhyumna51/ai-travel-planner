import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function createCustomMarkerIcon(category, numberStr) {
  const color = categoryColors[category] || categoryColors.default;
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9), 0 4px 10px rgba(0,0,0,0.6);
        border: 1px solid rgba(0,0,0,0.3);
        font-family: var(--font-mono);
      ">
        ${numberStr}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
}

const hotelIcon = L.divIcon({
  className: 'custom-map-marker hotel',
  html: `
    <div style="
      background: #0f172a;
      color: #2dd4bf;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
      box-shadow: 0 0 0 2px #2dd4bf, 0 4px 10px rgba(0,0,0,0.6);
      border: 1px solid rgba(0,0,0,0.3);
    ">
      🏨
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

export default function MapContainer({ mapData, selectedDay, selectedAttraction, onAttractionSelect }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayerGroup = useRef(null);
  const routeLayerGroup = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const dayData = mapData?.days?.find(d => d.day_number === selectedDay) || mapData?.days?.[0];
    const initialCenter = dayData?.route?.waypoints?.[0] || { lat: 20.5937, lng: 78.9629 };

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialCenter.lat, initialCenter.lng], 13);

    // Dark theme CartoDB basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstance.current = map;
    markersLayerGroup.current = L.layerGroup().addTo(map);
    routeLayerGroup.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update Markers and Routes when selectedDay or mapData changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapData) return;

    const dayData = mapData.days.find(d => d.day_number === selectedDay);
    if (!dayData) return;

    markersLayerGroup.current.clearLayers();
    routeLayerGroup.current.clearLayers();

    const waypoints = dayData.route?.waypoints || [];
    const attractions = dayData.attractions || [];

    if (waypoints.length === 0) return;

    // 1. Add Hotel marker
    const hotelWp = waypoints[0];
    if (hotelWp) {
      L.marker([hotelWp.lat, hotelWp.lng], { icon: hotelIcon })
        .bindPopup(`
          <div style="color: #1e293b; font-family: var(--font-sans); min-width: 140px; padding: 4px;">
            <h4 style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #0f172a;">🏨 ${hotelWp.name}</h4>
            <p style="margin: 0; font-size: 11px; color: #64748b;">Daily base lodging for ${dayData.city}</p>
          </div>
        `)
        .addTo(markersLayerGroup.current);
    }

    // 2. Add Attraction markers
    attractions.forEach((attr, idx) => {
      const markerIcon = createCustomMarkerIcon(attr.category, (idx + 1).toString());
      L.marker([attr.latitude, attr.longitude], { icon: markerIcon })
        .bindPopup(`
          <div style="color: #1e293b; font-family: var(--font-sans); min-width: 160px; padding: 4px;">
            <h4 style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #0f172a;">${idx + 1}. ${attr.name}</h4>
            <div style="margin-bottom: 6px;">
              <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${categoryColors[attr.category] || '#2dd4bf'}; background: ${categoryColors[attr.category] + '20' || '#2dd4bf20'}; padding: 2px 6px; border-radius: 3px; font-family: var(--font-mono);">
                ${attr.category}
              </span>
            </div>
            <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.4;">
              <strong>Arrival:</strong> ${attr.arrival_time}<br/>
              <strong>Duration:</strong> ${attr.duration_minutes} mins<br/>
              <strong>From previous:</strong> ${attr.distance_from_previous_m > 0 ? (attr.distance_from_previous_m / 1000).toFixed(1) + ' km' : 'Start'}
            </p>
          </div>
        `)
        .on('click', () => {
          if (onAttractionSelect) onAttractionSelect(attr);
        })
        .addTo(markersLayerGroup.current);
    });

    // 3. Draw Polylines
    if (dayData.route?.polyline) {
      try {
        const geojson = JSON.parse(dayData.route.polyline);
        const routeColor = dayColors[(selectedDay - 1) % dayColors.length];

        // Glow layer
        L.geoJSON(geojson, {
          style: {
            color: routeColor,
            weight: 6,
            opacity: 0.15,
            lineCap: 'round',
            lineJoin: 'round'
          }
        }).addTo(routeLayerGroup.current);

        // Animated flowing layer
        L.geoJSON(geojson, {
          style: {
            color: routeColor,
            weight: 3.5,
            opacity: 0.85,
            className: 'animated-route-line',
            lineCap: 'round',
            lineJoin: 'round'
          }
        }).addTo(routeLayerGroup.current);
      } catch (err) {
        console.error('Error drawing polyline:', err);
      }
    }

    // 4. Zoom to fit all waypoints
    const bounds = L.latLngBounds(waypoints.map(wp => [wp.lat, wp.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [selectedDay, mapData]);

  // Center on Highlighted Attraction
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !selectedAttraction) return;

    map.setView([selectedAttraction.latitude, selectedAttraction.longitude], 15, { animate: true });

    markersLayerGroup.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const latLng = layer.getLatLng();
        if (
          Math.abs(latLng.lat - selectedAttraction.latitude) < 0.0001 &&
          Math.abs(latLng.lng - selectedAttraction.longitude) < 0.0001
        ) {
          layer.openPopup();
        }
      }
    });
  }, [selectedAttraction]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#0b0f14' }} />
      {/* Decorative compass indicator */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-border)',
        borderRadius: '50%',
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        boxShadow: 'var(--shadow-md)',
        pointerEvents: 'none'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="12,6 15,12 12,18 9,12" fill="var(--color-teal-dim)" />
        </svg>
      </div>
    </div>
  );
}
