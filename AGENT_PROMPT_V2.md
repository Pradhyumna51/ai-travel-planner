# 🗺️ AI Travel Planner V2 - Coding Agent Prompt

## MISSION
Add interactive maps to the working V1 app. Users now see each day's attractions on a map with optimized walking routes, distances, and turn-by-turn directions.

**V1 Problem:** User reads "Day 1: Senso-ji Temple, Shibuya Crossing, Shinjuku" - but has no idea where these are or how far apart.

**V2 Solution:** Visual map showing attractions, walking routes, distances, and navigation.

---

## NEW FEATURES (V2)

✅ **Interactive map** (Leaflet + OpenStreetMap)
✅ **Attractions plotted** with category-based icons
✅ **Daily routes** (polylines showing optimized walking path)
✅ **Route optimization** (order attractions to minimize distance)
✅ **Turn-by-turn directions** (how to get between attractions)
✅ **Day selector** (switch between days, map updates)
✅ **Responsive mobile** (full-width map, swipe navigation)

---

## TECH STACK (V2 New)

### Frontend Dependencies (Add to V1)
```bash
npm install leaflet leaflet-routing-machine leaflet-markercluster turf axios
```

**Libraries:**
- `leaflet` - Interactive maps
- `leaflet-markercluster` - Group nearby markers
- `turf` - Distance calculations
- `axios` - Already have, reuse for new API calls

### Backend Dependencies (Add to V1)
```bash
npm install turf geohash
```

**External APIs (Free, no keys):**
- **OpenStreetMap** - Map tiles
- **OSRM** - Route optimization
- **Nominatim** - Address to coordinates

---

## DATABASE CHANGES

### Update Existing Tables

#### Add columns to `itineraries` table
```sql
ALTER TABLE itineraries ADD COLUMN start_lat REAL;
ALTER TABLE itineraries ADD COLUMN start_lng REAL;
ALTER TABLE itineraries ADD COLUMN total_walking_km REAL;
ALTER TABLE itineraries ADD COLUMN total_walking_time_min INTEGER;
ALTER TABLE itineraries ADD COLUMN attraction_count INTEGER;
ALTER TABLE itineraries ADD COLUMN polylines TEXT;
```

#### Update `attractions` table
```sql
-- Add these columns:
ALTER TABLE attractions ADD COLUMN address TEXT;
ALTER TABLE attractions ADD COLUMN rating REAL;
ALTER TABLE attractions ADD COLUMN review_count INTEGER;
ALTER TABLE attractions ADD COLUMN image_url TEXT;

-- Create spatial index for fast searches
CREATE INDEX idx_attractions_location ON attractions(latitude, longitude);
```

### New Tables

#### daily_attractions
```sql
CREATE TABLE daily_attractions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itinerary_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  attraction_id INTEGER NOT NULL,
  sequence_order INTEGER NOT NULL,
  arrival_time TEXT,
  departure_time TEXT,
  duration_minutes INTEGER,
  distance_from_previous_m INTEGER,
  walking_time_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id),
  FOREIGN KEY (attraction_id) REFERENCES attractions(id)
);
CREATE INDEX idx_daily_attractions_itinerary ON daily_attractions(itinerary_id, day_number);
```

#### routes
```sql
CREATE TABLE routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itinerary_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  from_attraction_id INTEGER,
  to_attraction_id INTEGER,
  distance_meters INTEGER,
  walking_time_minutes INTEGER,
  polyline TEXT,
  route_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id),
  FOREIGN KEY (from_attraction_id) REFERENCES attractions(id),
  FOREIGN KEY (to_attraction_id) REFERENCES attractions(id)
);
CREATE INDEX idx_routes_itinerary ON routes(itinerary_id, day_number);
```

---

## NEW API ENDPOINTS

### GET /api/trips/:tripId/map-data
Returns everything for map display.

**Response:**
```json
{
  "trip": { "id": 1, "destination": "Tokyo" },
  "days": [
    {
      "day_number": 1,
      "city": "Tokyo",
      "attractions": [
        {
          "id": 123,
          "name": "Senso-ji Temple",
          "latitude": 35.7148,
          "longitude": 139.7967,
          "category": "history",
          "arrival_time": "09:00 AM",
          "departure_time": "11:00 AM",
          "distance_from_previous_m": 1500,
          "walking_time_minutes": 20,
          "rating": 4.5,
          "image_url": "https://..."
        }
      ],
      "route": {
        "polyline": "...",
        "total_distance_m": 8500,
        "total_walking_time_min": 240,
        "waypoints": [
          { "lat": 35.7148, "lng": 139.7967, "name": "Senso-ji" }
        ]
      },
      "summary": {
        "walking_km": 8.5,
        "walking_time_min": 240,
        "attraction_count": 5
      }
    }
  ]
}
```

### POST /api/routes/optimize
Optimize attraction order for a day.

**Request:**
```json
{
  "city": "Tokyo",
  "start_point": { "latitude": 35.6895, "longitude": 139.6917 },
  "attractions": [
    { "id": 1, "latitude": 35.7148, "longitude": 139.7967, "duration_min": 60 },
    { "id": 2, "latitude": 35.6762, "longitude": 139.7674, "duration_min": 90 },
    { "id": 3, "latitude": 35.6595, "longitude": 139.7004, "duration_min": 120 }
  ],
  "end_point": { "latitude": 35.6761, "longitude": 139.7640 }
}
```

**Response:**
```json
{
  "optimized_order": [
    { "id": 1, "sequence": 1, "arrival_time": "09:00", "departure_time": "10:00" },
    { "id": 2, "sequence": 2, "arrival_time": "10:30", "departure_time": "12:00" },
    { "id": 3, "sequence": 3, "arrival_time": "12:30", "departure_time": "14:30" }
  ],
  "total_distance_m": 8500,
  "total_walking_time_min": 240,
  "polyline": "..."
}
```

### GET /api/routes/:routeId/directions
Get turn-by-turn directions.

**Response:**
```json
{
  "route": {
    "distance_m": 1500,
    "duration_s": 1200,
    "legs": [
      {
        "distance_m": 150,
        "duration_s": 60,
        "instruction": "Head north on Main Street",
        "maneuver": "turn right"
      }
    ]
  }
}
```

---

## FRONTEND COMPONENTS (NEW/MODIFIED)

### MapContainer.jsx (Main Component)
**Show interactive Leaflet map**
- Props: `tripId`, `selectedDay`, `onDayChange`, `onAttractionClick`
- Initialize Leaflet map at city coordinates
- Load and render map data
- Display attraction markers
- Draw polyline for daily route
- Handle zoom/pan
- Responsive sizing

**State:**
```javascript
{
  map: null, // Leaflet instance
  markers: [],
  polylines: [],
  selectedDay: 1,
  mapData: {},
  loading: true
}
```

**Lifecycle:**
1. On mount: Fetch map data, initialize map
2. On selectedDay change: Update markers/polylines
3. On unmount: Clean up event listeners

### AttractionMarker.jsx
Custom marker with:
- Category color icon (red=food, blue=history, etc.)
- Popup on click with:
  - Name, category, rating
  - Address, opening hours
  - Travel time from previous attraction
  - "View Details" button

**Marker colors:**
```javascript
const categoryColors = {
  food: '#ef4444',
  photography: '#3b82f6',
  history: '#8b5cf6',
  nature: '#10b981',
  anime: '#ec4899',
  nightlife: '#f59e0b',
  shopping: '#06b6d4',
  adventure: '#6366f1',
};
```

### DaySidebar.jsx
**Right sidebar** (collapses on mobile):
- Day selector (tabs or carousel)
- Day summary: "8.5 km walked | 5 attractions | 7 hours"
- List of attractions with:
  - Name, arrival/departure time
  - Distance from previous
  - Click to highlight on map

### RouteDirections.jsx
**Turn-by-turn instructions:**
- Start location
- List of maneuvers (turn left, go straight, etc.)
- Distance & time per leg
- Total distance + time
- "Copy directions" button
- "Open in Maps" button

### AttractionCard.jsx (Enhanced)
**When marker clicked:**
- Large image
- Name, rating, review count
- Address, phone, website
- Opening hours
- "Get Directions" button
- "Add to Favorites" button (for V3)

---

## BACKEND SERVICES (NEW)

### mapService.js
```javascript
async function getMapDataForTrip(tripId) {
  // Fetch trip with attractions and routes
  // Return formatted map data
}

async function getAttractionsByDay(tripId, dayNumber) {
  // Get attractions for that day
}
```

### routeOptimizationService.js
```javascript
async function optimizeRoute(city, startPoint, attractions, endPoint) {
  // 1. Calculate distances between all pairs (OSRM API)
  // 2. Use nearest neighbor algorithm to order
  // 3. Generate polyline
  // 4. Return optimized sequence
}

async function calculateRoute(from, to) {
  // Call OSRM API for realistic routing
  // Get distance, duration, polyline
  // Cache result
}

// Nearest neighbor algorithm
function nearestNeighbor(startPoint, attractions, endPoint) {
  let current = startPoint;
  let visited = [];
  let order = [];
  
  while (unvisited.length > 0) {
    let nearest = findNearest(current, unvisited);
    order.push(nearest);
    visited.push(nearest.id);
    current = nearest;
  }
  
  order.push(endPoint);
  return order;
}
```

### attractionService.js
```javascript
async function findNearbyAttractions(lat, lng, radiusM, category, limit) {
  // Query attractions within radius
  // Return sorted by distance
}

async function clusterAttractions(attractions) {
  // Group nearby attractions (within 500m)
  // Return clusters
}
```

### directionsService.js
```javascript
async function getTurns(polyline) {
  // Convert polyline to turn-by-turn
  // Use OSRM for routing steps
  // Return maneuvers + instructions
}

async function exportAsGPX(route) {
  // Convert route to GPX format
  // Return downloadable file
}
```

### geocodingService.js
```javascript
async function addressToCoordinates(address, city) {
  // Use Nominatim (free geocoding)
  // Convert "Senso-ji Temple, Tokyo" → lat/lng
  // Cache results
}

async function coordinatesToAddress(lat, lng) {
  // Reverse geocoding
}
```

---

## BUILD ORDER (EXECUTE IN THIS SEQUENCE)

### Phase 1: Basic Map (Days 1-2)
1. ✅ Install Leaflet + dependencies
2. ✅ Update database schema (new tables + columns)
3. ✅ Create MapContainer component
4. ✅ Initialize Leaflet map
5. ✅ Create AttractionMarker component
6. ✅ Plot markers for attractions
7. ✅ Test markers appear correctly
8. ✅ Create DaySidebar component
9. ✅ Implement day switching
10. ✅ Draw polylines for routes

### Phase 2: Route Optimization (Days 2-3)
1. ✅ Create routeOptimizationService
2. ✅ Implement nearest neighbor algorithm
3. ✅ Create `/api/routes/optimize` endpoint
4. ✅ Call OSRM API for realistic routing
5. ✅ Cache routes in database
6. ✅ Update map data API endpoint
7. ✅ Test route ordering makes sense

### Phase 3: Directions & Details (Day 3)
1. ✅ Create directionsService
2. ✅ Create `/api/routes/:routeId/directions` endpoint
3. ✅ Create RouteDirections component
4. ✅ Add "Get Directions" button
5. ✅ Display turn-by-turn instructions
6. ✅ Add copy/share functionality

### Phase 4: Polish & Mobile (Day 4)
1. ✅ Mobile responsiveness (full-width map)
2. ✅ Bottom sheet sidebar on mobile
3. ✅ Swipe navigation for days
4. ✅ Touch gesture support (pinch zoom)
5. ✅ Performance optimization
6. ✅ Error handling (no attractions, network errors)
7. ✅ Loading states
8. ✅ Testing + bug fixes

---

## KEY ALGORITHMS & LOGIC

### Nearest Neighbor (Route Optimization)
**Goal:** Order attractions to minimize walking distance.

**Simple algorithm:**
1. Start at Hotel
2. Find nearest unvisited attraction
3. Move to it
4. Repeat until all visited
5. Return to Hotel

**Complexity:** O(n²) - fast enough for <20 attractions/day
**Quality:** Good enough for MVP (80% optimal)
**Future:** Can upgrade to genetic algorithm for better results

### Distance Calculation
Use Turf.js for straight-line distance:
```javascript
import { distance } from '@turf/turf';

const point1 = turf.point([lat1, lng1]);
const point2 = turf.point([lat2, lng2]);
const dist = distance(point1, point2, { units: 'kilometers' });
```

Use OSRM for realistic walking distances (accounts for roads).

### Polyline Generation
Store polylines as encoded strings (smaller file size):
```javascript
// Encode: array of [lat, lng] → string
const encoded = polyline.encode(coordinates);

// Decode: string → array of [lat, lng]
const decoded = polyline.decode(encoded);
```

---

## TESTING CHECKLIST

### Map Functionality
- [ ] Leaflet map initializes
- [ ] Markers plot at correct coordinates
- [ ] Polylines draw correctly
- [ ] Zoom controls work
- [ ] Pan works (click + drag)
- [ ] Click marker → popup shows
- [ ] Click outside → popup closes

### Day Navigation
- [ ] Day tabs/carousel work
- [ ] Map updates on day change
- [ ] Sidebar shows correct attractions
- [ ] Polyline changes per day
- [ ] Summary updates

### Route Optimization
- [ ] Optimization runs successfully
- [ ] Attractions in logical order (no zigzag)
- [ ] Total distance calculated
- [ ] Times reasonable
- [ ] Route: hotel → attractions → hotel

### Directions
- [ ] Directions display correctly
- [ ] Distance/time accurate
- [ ] "Copy directions" works
- [ ] "Open in Maps" links work
- [ ] Maneuvers make sense

### Mobile
- [ ] Map responsive (full width)
- [ ] Sidebar accessible
- [ ] No horizontal scroll
- [ ] Touch targets 44px+
- [ ] Readable text
- [ ] Swipe works

### Performance
- [ ] Map loads < 3 seconds
- [ ] Day switch < 500ms
- [ ] Popups appear instantly
- [ ] No lag panning/zooming
- [ ] Mobile: FPS > 60

### Data Accuracy
- [ ] Coordinates correct
- [ ] Distances realistic (±5%)
- [ ] Walking times reasonable
- [ ] Routes avoid obstacles
- [ ] No phantom attractions

### Edge Cases
- [ ] 1-day trips work
- [ ] 30-day trips work
- [ ] Cities far apart handled
- [ ] No attractions → graceful message
- [ ] Offline → cached data used

---

## EXTERNAL APIS (Free, No Keys Required)

### OSRM (Route Optimization)
```
POST https://router.project-osrm.org/route/v1/walking/13.388860,52.517037;13.397634,52.529407
```
Returns distance, duration, polyline.

**Limits:** 10,000 requests/day per IP (plenty for MVP)

### Nominatim (Geocoding)
```
GET https://nominatim.openmap.com/search?q=Senso-ji+Temple&format=json
```
Returns coordinates for address.

**Limits:** 1 request/second (cache results)

### OpenStreetMap (Map Tiles)
No API key needed. Built into Leaflet.

---

## COMMON ERRORS & FIXES

**Error:** "Leaflet is not defined"
- **Fix:** Make sure CSS imported: `import 'leaflet/dist/leaflet.css'`

**Error:** Polyline not showing
- **Fix:** Check coordinates are [lat, lng], not [lng, lat]

**Error:** Markers appear but don't cluster
- **Fix:** Make sure markercluster CSS loaded

**Error:** OSRM returns 400 error
- **Fix:** Check lat/lng are valid (not swapped, not out of range)

**Error:** Map doesn't resize
- **Fix:** Call `map.invalidateSize()` after container resize

---

## PERFORMANCE OPTIMIZATION

### Frontend
- Lazy load map (only when needed)
- Memoize marker/polyline components
- Debounce resize (200ms)
- Image lazy loading
- Use Web Workers for polyline encoding (optional)

### Backend
- Cache attractions nearby (in-memory)
- Spatial index on database
- Cache OSRM results by coordinate pair
- Connection pool for DB

### Mobile
- Simplify polylines on zoom out
- Use simplified marker icons at low zoom
- Lazy load attractions

---

## SUCCESS CRITERIA FOR V2

✅ Interactive map displays for each day
✅ Attractions plotted correctly
✅ Routes optimized + drawn
✅ Day selector works
✅ Directions show turn-by-turn
✅ Mobile fully responsive
✅ Map loads fast (< 3s)
✅ No console errors
✅ All tests passing
✅ Feels smooth on mobile (60 FPS)

---

## IF YOU GET STUCK

**Map won't initialize?**
- Check MapContainer mounted
- Check map container div has height
- Check Leaflet CSS imported

**Markers won't show?**
- Check lat/lng in correct format
- Check coordinates are valid
- Check zoom level (zoom > 8)

**Routes aren't optimizing?**
- Check OSRM API accessible
- Check attractions in same city
- Check algorithm logic

**Mobile issues?**
- Test on actual device (not just responsive mode)
- Check touch event handlers
- Test on both iOS and Android

---

## WEEKS BREAKDOWN

**Week 1 (Days 1-2):** Leaflet map + markers
**Week 1 (Days 3-4):** Route optimization
**Week 2 (Days 1-2):** Directions + details
**Week 2 (Days 3-4):** Mobile + polish

**Total: 8-10 focused days of development**

---

## AFTER V2 COMPLETE

Start V3 when V2 fully working:
- Real attractions (Google Places API)
- Weather forecasts
- Public transport options
- Advanced route optimization
- Offline maps

---

## KEY REMINDER

✨ **This is achievable.** You already built V1 (itinerary works).

V2 just adds the visual map layer on top of it. The hard work is already done.

🎯 **Focus on:** Get basic map working first. Then add routes. Then polish.

📍 **Don't:** Try to do everything at once. Build in phases, test after each phase.

🚀 **You've got this!** Maps are simpler than itinerary AI logic.
