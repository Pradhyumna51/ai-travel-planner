-- Schema for AI Travel Planner Database

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  budget INTEGER NOT NULL,
  travelers INTEGER NOT NULL,
  interests TEXT NOT NULL, -- JSON string: ["Food", "Photography"]
  travel_style TEXT DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  city TEXT NOT NULL,
  title TEXT NOT NULL,
  morning_venue TEXT,
  morning_activity TEXT,
  afternoon_venue TEXT,
  afternoon_activity TEXT,
  evening_venue TEXT,
  evening_activity TEXT,
  estimated_cost INTEGER,
  start_lat REAL,
  start_lng REAL,
  total_walking_km REAL,
  total_walking_time_min INTEGER,
  attraction_count INTEGER,
  polylines TEXT, -- JSON with all day routes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE IF NOT EXISTS attractions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL, -- Food, Photography, History, Nature, Trekking, Anime, Nightlife, Shopping, Adventure
  description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  average_duration INTEGER, -- minutes
  estimated_cost INTEGER,
  rating REAL,
  review_count INTEGER,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attractions_location ON attractions(latitude, longitude);

CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  rating REAL,
  price_per_night INTEGER,
  amenities TEXT, -- JSON string e.g. '["WiFi", "Breakfast"]'
  booking_url TEXT
);

CREATE TABLE IF NOT EXISTS daily_attractions (
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

CREATE INDEX IF NOT EXISTS idx_daily_attractions_itinerary ON daily_attractions(itinerary_id, day_number);

CREATE TABLE IF NOT EXISTS routes (
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

CREATE INDEX IF NOT EXISTS idx_routes_itinerary ON routes(itinerary_id, day_number);
