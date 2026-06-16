# AI Travel Planner V2 - Maps & Route Optimization

## Vision
Transform V1 from text-based itinerary into an **interactive map experience**. Users see each day's attractions plotted on a map with optimized walking routes, distances, and turn-by-turn directions.

**V1 Problem:** Users read itinerary but don't know where things are or how far apart.
**V2 Solution:** Visual map with routes, distances, and navigation.

---

## V2 Features (MVP)

### Core Features
1. ✅ **Interactive Map** (Leaflet + OpenStreetMap)
   - Display attractions for selected day
   - Multiple markers per location type (colored)
   - Click markers to see details
   - Pan/zoom functionality
   - Mobile-friendly touch controls

2. ✅ **Daily Routes** (Polylines on map)
   - Draw optimized walking route for each day
   - Color-coded by day (Day 1 = blue, Day 2 = purple, etc.)
   - Show distance & duration for each leg
   - Start → Attraction 1 → Attraction 2 → Hotel

3. ✅ **Attraction Clustering**
   - Group nearby attractions (within 500m)
   - Show cluster count
   - Expand cluster on click
   - Visual grouping by category (food, history, photos, etc.)

4. ✅ **Route Optimization**
   - Calculate shortest path between attractions
   - Optimize order (don't zig-zag)
   - Consider walking time + visit duration
   - Suggest realistic daily itineraries

5. ✅ **Walking Directions**
   - Turn-by-turn directions between waypoints
   - Distance & time estimates
   - "View on map" button opens Leaflet
   - Copy directions to share

6. ✅ **Day Selector**
   - Tab or carousel to select day
   - Map updates with that day's attractions
   - Route updates to show daily path
   - Summary: "8.5km walked, 6 attractions, 7 hours"

### Secondary Features
- Search for specific attractions on map
- Filter by category (food, history, photos, etc.)
- Save favorite attractions
- Export route as GPX (for GPS apps)
- Share route link with friends

---

## Technology Stack

### Frontend (New Libraries)
```json
{
  "leaflet": "^1.9.4",
  "leaflet-routing-machine": "^3.2.12",
  "leaflet-markercluster": "^1.5.0",
  "turf": "^6.5.0",
  "axios": "^1.6.0"
}
```

**Libraries Explanation:**
- **Leaflet:** Interactive maps library
- **Leaflet Routing Machine:** Turn-by-turn directions
- **Leaflet MarkerCluster:** Group nearby markers
- **Turf.js:** Calculate distances, optimize routes
- **Axios:** API calls to new endpoints

### Backend (New Libraries)
```json
{
  "osrm": "^5.27.0",
  "turf": "^6.5.0",
  "geohash": "^0.13.0"
}
```

**Libraries Explanation:**
- **OSRM (Open Route Service Machine):** Calculate optimal routes
- **Turf.js:** Geometric calculations
- **Geohash:** Spatial indexing for clustering

### External APIs
- **OpenStreetMap** (free, no API key needed)
- **OSRM (Open Route Service)** (free routing engine)
- **Nominatim** (free geocoding - convert address to lat/lng)
- Optional: Google Places API (future for real attraction data)

---

## Database Changes (V1 → V2)

### New/Updated Tables

#### attractions (Enhanced)
```sql
CREATE TABLE attractions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL, -- food, photography, history, nature, anime, nightlife, shopping, adventure
  description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  average_duration INTEGER, -- minutes to spend here
  estimated_cost INTEGER,
  rating REAL,
  review_count INTEGER,
  image_url TEXT,
  opening_hours TEXT, -- JSON: {"monday": "9am-5pm", ...}
  website TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for fast nearby searches
CREATE INDEX idx_attractions_location ON attractions(latitude, longitude);
```

#### daily_attractions (New)
```sql
CREATE TABLE daily_attractions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itinerary_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  attraction_id INTEGER NOT NULL,
  sequence_order INTEGER NOT NULL, -- 1st, 2nd, 3rd attraction of the day
  arrival_time TEXT, -- "09:30 AM"
  departure_time TEXT, -- "11:00 AM"
  duration_minutes INTEGER,
  distance_from_previous_m INTEGER, -- meters
  walking_time_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id),
  FOREIGN KEY (attraction_id) REFERENCES attractions(id)
);

CREATE INDEX idx_daily_attractions_itinerary ON daily_attractions(itinerary_id, day_number);
```

#### routes (New)
```sql
CREATE TABLE routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itinerary_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  from_attraction_id INTEGER,
  to_attraction_id INTEGER,
  distance_meters INTEGER,
  walking_time_minutes INTEGER,
  polyline TEXT, -- GeoJSON LineString
  route_json TEXT, -- Full OSRM response
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id),
  FOREIGN KEY (from_attraction_id) REFERENCES attractions(id),
  FOREIGN KEY (to_attraction_id) REFERENCES attractions(id)
);

CREATE INDEX idx_routes_itinerary ON routes(itinerary_id, day_number);
```

#### itineraries (Updated)
```sql
-- Add these columns to existing itineraries table:
ALTER TABLE itineraries ADD COLUMN start_lat REAL;
ALTER TABLE itineraries ADD COLUMN start_lng REAL;
ALTER TABLE itineraries ADD COLUMN total_walking_km REAL;
ALTER TABLE itineraries ADD COLUMN total_walking_time_min INTEGER;
ALTER TABLE itineraries ADD COLUMN attraction_count INTEGER;
ALTER TABLE itineraries ADD COLUMN polylines TEXT; -- JSON with all day routes
```

---

## API Endpoints (V2 New/Modified)

### GET /api/trips/:tripId/map-data
Returns all data needed to display map for a trip.

**Response:**
```json
{
  "trip": {
    "id": 1,
    "origin": "Goa",
    "destination": "Japan",
    "start_date": "2024-02-01"
  },
  "days": [
    {
      "day_number": 1,
      "city": "Tokyo",
      "date": "2024-02-01",
      "attractions": [
        {
          "id": 123,
          "name": "Senso-ji Temple",
          "latitude": 35.7148,
          "longitude": 139.7967,
          "category": "history",
          "arrival_time": "09:00 AM",
          "departure_time": "11:00 AM",
          "duration_minutes": 120,
          "distance_from_previous_m": 1500,
          "walking_time_minutes": 20,
          "address": "Asakusa, Taito Ward, Tokyo",
          "rating": 4.5,
          "image_url": "https://..."
        },
        // ... more attractions
      ],
      "route": {
        "polyline": "...", // Encoded polyline or GeoJSON
        "total_distance_m": 8500,
        "total_walking_time_min": 240,
        "waypoints": [
          { "lat": 35.7148, "lng": 139.7967, "name": "Senso-ji" },
          // ... more waypoints
        ]
      },
      "summary": {
        "walking_km": 8.5,
        "walking_time_min": 240,
        "attraction_count": 5,
        "estimated_end_time": "6:00 PM"
      }
    },
    // ... more days
  ]
}
```

### POST /api/attractions/nearby
Find attractions near a location.

**Request:**
```json
{
  "latitude": 35.7148,
  "longitude": 139.7967,
  "radius_m": 500,
  "category": "food",
  "limit": 10
}
```

**Response:**
```json
{
  "attractions": [
    {
      "id": 1,
      "name": "Restaurant ABC",
      "latitude": 35.7150,
      "longitude": 139.7970,
      "distance_m": 45,
      "rating": 4.3,
      "category": "food"
    },
    // ... more
  ],
  "total_count": 25,
  "clustered": false
}
```

### POST /api/routes/optimize
Optimize order of attractions for a day.

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
  "end_point": { "latitude": 35.6761, "longitude": 139.7640 } // Hotel location
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
  "polyline": "...",
  "summary": {
    "start_time": "09:00",
    "end_time": "14:30",
    "walking_km": 8.5
  }
}
```

### GET /api/routes/:routeId/directions
Get turn-by-turn directions for a route leg.

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
      },
      {
        "distance_m": 200,
        "duration_s": 90,
        "instruction": "Continue straight onto Park Avenue",
        "maneuver": "straight"
      },
      // ... more legs
    ]
  }
}
```

### POST /api/trips/:tripId/routes/export
Export route as GPX file.

**Response:** GPX file download (for GPS apps, Apple Maps, Google Maps)

---

## Frontend Components (V2)

### 1. MapContainer.jsx (Main Map Component)
**Props:**
- `tripId` (which trip to display)
- `selectedDay` (current day)
- `onDayChange` (callback when day changes)
- `onAttractionClick` (callback when marker clicked)

**Features:**
- Initialize Leaflet map centered on first day's city
- Load and render map data
- Display markers for attractions
- Draw polyline for daily route
- Handle zoom/pan
- Responsive sizing

**State:**
```javascript
{
  map: null, // Leaflet map instance
  markers: [], // Marker objects
  polylines: [], // Line objects
  selectedDay: 1,
  mapData: {}, // Full trip map data
  loading: true,
  error: null
}
```

### 2. AttractionMarker.jsx
Custom Leaflet marker with:
- Category-based icon color (red=food, blue=history, etc.)
- Popup on click with:
  - Name, category, rating
  - Address, opening hours
  - "View Details" button
  - Travel time from previous attraction

### 3. DaySidebar.jsx
Right sidebar showing:
- Day selector (tabs or carousel)
- Day summary (X km walked, Y attractions, Z hours)
- List of attractions for that day:
  - Name, time, duration
  - Arrival/departure times
  - Distance from previous
  - Click to highlight on map

**Responsive:** Collapse to top slider on mobile

### 4. RouteDirections.jsx
Show turn-by-turn directions for a leg:
- Start location
- List of maneuvers with instructions
- Distance + time for each leg
- Total distance + time
- "Copy directions" button
- "Open in Maps" button (links to Google Maps)

### 5. AttractionCard.jsx (Enhanced from V1)
When marker clicked, show:
- Large image
- Name, rating, review count
- Address, phone, website
- Opening hours (if available)
- "Get Directions" button
- "Add to Favorites" button
- "View on Google Maps" link

### 6. RouteOptimizationPanel.jsx (New)
Show route details:
- Total distance (km)
- Total walking time
- Estimated duration
- "Regenerate Route" button (re-optimize)
- "Export Route" button

---

## Backend Services (V2)

### 1. mapService.js
```javascript
async function getMapDataForTrip(tripId) {
  // Fetch trip with attractions and routes
  // Return formatted map data
}

async function getAttractionsByDay(tripId, dayNumber) {
  // Get attractions for specific day
}
```

### 2. routeOptimizationService.js
```javascript
async function optimizeRoute(city, startPoint, attractions, endPoint) {
  // 1. Cluster nearby attractions
  // 2. Calculate distances between all pairs (OSRM)
  // 3. Solve TSP (Traveling Salesman Problem) - nearest neighbor
  // 4. Generate polyline from optimized order
  // Return optimized sequence
}

async function calculateRoute(from, to) {
  // Call OSRM API
  // Get polyline + distance + duration
  // Return route
}
```

### 3. attractionService.js
```javascript
async function findNearbyAttractions(lat, lng, radiusM, category, limit) {
  // Query attractions within radius
  // Filter by category if specified
  // Calculate distance to each
  // Return sorted by distance
}

async function clusterAttractions(attractions) {
  // Group attractions within 500m
  // Return clusters with count
}
```

### 4. directionsService.js
```javascript
async function getTurns(polyline) {
  // Convert polyline to turn-by-turn directions
  // Use OSRM for routing steps
  // Return maneuvers + instructions
}

async function exportAsGPX(route) {
  // Convert route to GPX format
  // Return GPX file
}
```

### 5. geocodingService.js
```javascript
async function addressToCoordinates(address, city) {
  // Use Nominatim (free geocoding)
  // Convert "Senso-ji Temple, Tokyo" to lat/lng
  // Cache results
}

async function coordinatesToAddress(lat, lng) {
  // Reverse geocoding
}
```

---

## Data Processing Pipeline (V2)

### When User Views Map (Initial Load)

1. **Frontend:** Calls `GET /api/trips/:tripId/map-data`

2. **Backend:**
   - Fetch trip + itinerary
   - For each day:
     - Get attractions from `daily_attractions` table
     - If routes don't exist, generate them:
       a. Call `routeOptimizationService.optimizeRoute()`
       b. For each leg, call OSRM API
       c. Store routes in `routes` table
     - Calculate totals (distance, time)
   - Return formatted response

3. **Frontend:**
   - Initialize Leaflet map
   - Center on first day's city
   - Plot all attractions as markers
   - Draw polyline for Day 1
   - Show DaySidebar with attractions

### When User Switches Day

1. **Frontend:** 
   - Update `selectedDay`
   - Fetch that day's data (already cached)
   - Remove previous markers/polylines
   - Plot new markers
   - Draw new polyline
   - Update sidebar

### When User Clicks Attraction Marker

1. **Frontend:**
   - Show AttractionCard popup
   - Highlight marker
   - Pan map to center on marker
   - Show route to next attraction

### When User Requests Directions

1. **Frontend:** Calls `GET /api/routes/:routeId/directions`

2. **Backend:**
   - Fetch route from database
   - Parse OSRM response
   - Convert to turn-by-turn instructions
   - Return as JSON

3. **Frontend:**
   - Display RouteDirections component
   - User can copy or open in Google Maps

---

## Algorithm: Route Optimization (Nearest Neighbor)

**Goal:** Order attractions to minimize walking distance.

**Algorithm:**
```
1. Start at Hotel
2. Find nearest unvisited attraction → Visit it
3. Mark as visited
4. Find nearest unvisited attraction → Visit it
5. Repeat until all visited
6. Return to Hotel
7. Calculate total distance
```

**Pseudocode:**
```javascript
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
  
  // Return to hotel
  order.push(endPoint);
  
  return order; // optimized sequence
}
```

**Complexity:** O(n²) - good for <20 attractions/day

**Alternative (Future):** Genetic algorithm or Ant Colony Optimization for better results with more attractions.

---

## Map Styling & Colors

### Marker Colors by Category
```javascript
const categoryColors = {
  food: '#ef4444', // red
  photography: '#3b82f6', // blue
  history: '#8b5cf6', // purple
  nature: '#10b981', // green
  anime: '#ec4899', // pink
  nightlife: '#f59e0b', // amber
  shopping: '#06b6d4', // cyan
  adventure: '#6366f1', // indigo
  hotel: '#374151', // gray (special marker)
  start: '#059669', // dark green (start point)
}
```

### Polyline Colors by Day
```javascript
// Cycle through 10 colors for 10+ day trips
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
```

### Map Styling
- **Base Map:** OpenStreetMap (bright, clear)
- **Zoom:** Start at level 13 (city/neighborhood view)
- **Min Zoom:** 10 (can see entire city)
- **Max Zoom:** 18 (street level detail)

---

## Performance Optimization

### Frontend
- **Lazy Load Map:** Only load when user scrolls to map section
- **Virtualize Sidebar:** Only render visible attractions in list
- **Memoize Components:** Use React.memo() for markers, polylines
- **Debounce Resize:** Map resize handler debounced to 200ms
- **Image Lazy Loading:** Attraction images with `loading="lazy"`

### Backend
- **Cache Attractions:** Store nearby attractions in memory
- **Index Database:** Create spatial indexes on lat/lng
- **OSRM Caching:** Cache route calculations by coordinate pair
- **Batch Requests:** Combine multiple route queries
- **CDN for Images:** Serve attraction images from CDN

### Database
- **Spatial Index:** `CREATE INDEX idx_attractions_location`
- **Query Optimization:** Only fetch needed columns
- **Connection Pool:** Reuse database connections

---

## Mobile Considerations

### Touch Interactions
- **Pan:** Single finger drag (Leaflet default)
- **Zoom:** Two-finger pinch (Leaflet default)
- **Select:** Tap marker to see details
- **Dismiss:** Tap outside popup to close

### Layout
- **Full-Width Map:** 100% width on mobile
- **Bottom Sheet:** Sidebar collapses to bottom sheet
- **Swipe Navigation:** Swipe left/right to change day
- **Tap Targets:** Markers 40px minimum
- **Button Size:** 44px minimum height for touch

### Performance
- **Render:** Simplify polylines on mobile (less detail)
- **Markers:** Use simplified icons on zoom out
- **Lazy Load:** Don't load all attractions at once

---

## Testing Checklist

### Map Functionality
- [ ] Leaflet map initializes correctly
- [ ] Markers plot on correct coordinates
- [ ] Polylines draw correctly between points
- [ ] Zoom controls work (+ and - buttons)
- [ ] Pan works (click and drag)
- [ ] Click marker → popup shows details
- [ ] Click outside popup → closes

### Day Navigation
- [ ] Day selector tabs/carousel work
- [ ] Map updates when day changes
- [ ] Sidebar shows correct attractions for day
- [ ] Polyline changes for each day
- [ ] Summary updates (distance, time, count)

### Route Optimization
- [ ] Optimization algorithm runs correctly
- [ ] Attractions are in logical order (not zigzag)
- [ ] Total distance is calculated correctly
- [ ] Estimated times are reasonable
- [ ] Route starts at hotel, ends at hotel

### Directions
- [ ] Turn-by-turn directions display correctly
- [ ] Distance and time are accurate
- [ ] "Copy directions" copies to clipboard
- [ ] "Open in Maps" links work
- [ ] Maneuvers make sense (no 180° turns)

### Performance
- [ ] Map loads in < 3 seconds
- [ ] Day switching < 500ms
- [ ] Marker popups appear instantly
- [ ] No lag when panning/zooming
- [ ] Mobile: FPS > 60, no jank
- [ ] Lighthouse score > 85

### Responsive Design
- [ ] Map works on mobile (not broken)
- [ ] Sidebar accessible on mobile
- [ ] No horizontal scroll
- [ ] Touch targets 44px+
- [ ] Readable text on small screens
- [ ] Portrait and landscape work

### Data Accuracy
- [ ] Coordinates match real locations
- [ ] Distances calculated correctly (±5%)
- [ ] Walking times realistic
- [ ] Routes don't go through water/mountains
- [ ] No phantom attractions

### Edge Cases
- [ ] 1-day trips work correctly
- [ ] 30-day trips work (performance)
- [ ] Cities far apart handled correctly
- [ ] No attractions available → graceful message
- [ ] Invalid coordinates → error handling
- [ ] Offline map → cached data used

---

## Dependencies & Installation

### Frontend
```bash
npm install leaflet leaflet-routing-machine leaflet-markercluster turf axios

# Tailwind for styling (already installed in V1)
# No additional config needed
```

### Backend
```bash
npm install turf geohash
# OSRM is free service (no npm install needed)
# Nominatim is free service (no npm install needed)
```

### CSS Imports (Frontend)
```javascript
// In main App component
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-markercluster/dist/MarkerCluster.css';
import 'leaflet-markercluster/dist/MarkerCluster.Default.css';
```

---

## Implementation Order

### Phase 1: Basic Map (Week 1)
1. ✅ Install dependencies
2. ✅ Create MapContainer component
3. ✅ Initialize Leaflet map
4. ✅ Create AttractionMarker component
5. ✅ Plot markers for attractions
6. ✅ Add zoom/pan controls
7. ✅ Create DaySidebar component
8. ✅ Implement day switching
9. ✅ Draw polylines for routes

### Phase 2: Route Optimization (Week 2)
1. ✅ Update database schema
2. ✅ Create routeOptimizationService
3. ✅ Implement nearest neighbor algorithm
4. ✅ Create `/api/routes/optimize` endpoint
5. ✅ Call OSRM for realistic routing
6. ✅ Cache routes in database
7. ✅ Update map data API endpoint

### Phase 3: Directions & Details (Week 2-3)
1. ✅ Create directionsService
2. ✅ Create `/api/routes/:routeId/directions` endpoint
3. ✅ Create RouteDirections component
4. ✅ Add "Get Directions" button
5. ✅ Display turn-by-turn instructions
6. ✅ Add copy/share functionality

### Phase 4: Polish & Optimization (Week 3)
1. ✅ Mobile responsiveness
2. ✅ Performance optimization
3. ✅ Error handling
4. ✅ Loading states
5. ✅ Testing
6. ✅ Accessibility (keyboard nav, ARIA labels)

---

## Success Criteria for V2

✅ Users can view interactive map of trip
✅ Attractions plotted with correct coordinates
✅ Polylines show walking routes for each day
✅ Day selector switches map content
✅ Distances & times calculated correctly
✅ Route optimization produces logical order
✅ Marker click shows attraction details
✅ Directions available for each leg
✅ Mobile fully functional
✅ Performance acceptable (map loads < 3s)
✅ No console errors
✅ All tests passing

---

## Known Limitations & Future Improvements

### V2 Limitations
- Uses simple nearest neighbor algorithm (not optimal for complex routes)
- Walking times don't account for hills/stairs
- Doesn't suggest public transport (walking only)
- No real-time traffic data
- Limited to 20 attractions/day (performance)

### V3+ Future Features
1. **Public Transport:** Show metro/bus options
2. **Real Attractions:** Integrate Google Places API
3. **Weather:** Show weather for each day/time
4. **Advanced Optimization:** Genetic algorithm for better routes
5. **Offline Maps:** Download map tiles for offline use
6. **AR Navigation:** Augmented reality directions (using AR.js)
7. **Social:** Share routes, see other travelers' routes
8. **Reviews:** Aggregate ratings from Google, TripAdvisor
9. **Bookings:** Book attractions/restaurants from map
10. **Time Machine:** See historical photos of locations

---

## Architecture Diagram (V2)

```
┌─────────────────────────────────────────────┐
│          Frontend (React)                    │
├─────────────────────────────────────────────┤
│                                             │
│  MapContainer.jsx                           │
│  ├─ Leaflet map instance                    │
│  ├─ AttractionMarker.jsx (x10-20)           │
│  ├─ RoutePolyline (for each day)            │
│  └─ DaySidebar.jsx                          │
│      ├─ Day tabs/carousel                   │
│      ├─ Attraction list                     │
│      └─ Route summary                       │
│                                             │
│  RouteDirections.jsx                        │
│  └─ Turn-by-turn instructions               │
│                                             │
└─────────────────────────────────────────────┘
           ↓ API Calls ↓
┌─────────────────────────────────────────────┐
│       Backend (Node.js + Express)           │
├─────────────────────────────────────────────┤
│                                             │
│  GET /api/trips/:tripId/map-data            │
│  ├─ tripService.getTripDetails()            │
│  ├─ attractionService.getAttractions()      │
│  ├─ routeService.getRoutes()                │
│  └─ Build response                          │
│                                             │
│  POST /api/routes/optimize                  │
│  ├─ routeOptimizationService.optimize()     │
│  ├─ Call OSRM API (external)                │
│  └─ Save routes to DB                       │
│                                             │
│  GET /api/routes/:routeId/directions        │
│  └─ directionsService.getTurns()            │
│                                             │
└─────────────────────────────────────────────┘
           ↓ Database ↓
┌─────────────────────────────────────────────┐
│        SQLite (travel_planner.db)           │
├─────────────────────────────────────────────┤
│                                             │
│  trips, itineraries, attractions            │
│  daily_attractions, routes                  │
│  (New: routes, daily_attractions)           │
│                                             │
└─────────────────────────────────────────────┘
           ↓ External APIs ↓
┌─────────────────────────────────────────────┐
│                                             │
│  OpenStreetMap (map tiles)                  │
│  OSRM (route optimization)                  │
│  Nominatim (geocoding)                      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Estimated Implementation Time

- **Basic Map Display:** 4-5 hours
- **Database Schema:** 2 hours
- **Route Optimization:** 4-5 hours
- **Directions/Details:** 3-4 hours
- **Mobile Responsiveness:** 3-4 hours
- **Testing & Polish:** 4-5 hours
- **Total: 20-27 hours** (assuming V1 complete)

---

## Common Pitfalls to Avoid

1. ❌ Don't hardcode map coordinates (use database)
2. ❌ Don't call OSRM for every pan/zoom (cache routes)
3. ❌ Don't load all attractions at once (lazy load)
4. ❌ Don't ignore mobile touch interactions (test on device)
5. ❌ Don't skip error states (network failures happen)
6. ❌ Don't assume all cities have nearby attractions
7. ❌ Don't forget to handle edge cases (1 attraction, 30 days, etc.)
8. ❌ Don't render polylines synchronously (use Web Workers)

---

## Notes

- **OSRM is free:** No API key needed, can be self-hosted if needed
- **Nominatim is free:** But has rate limits (1 request/second)
- **OpenStreetMap is free:** Community-driven, no API key
- **Leaflet is lightweight:** ~40KB minified, perfect for mobile
- **Turf.js is powerful:** Great for geographic calculations

This is a solid, achievable V2. Build it in phases, test as you go.
