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
  morning_activity TEXT,
  afternoon_activity TEXT,
  evening_activity TEXT,
  estimated_cost INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE IF NOT EXISTS attractions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL, -- Food, Photography, History, Nature, Trekking, Anime, Nightlife, Shopping, Adventure
  description TEXT,
  latitude REAL,
  longitude REAL,
  average_duration INTEGER, -- minutes
  estimated_cost INTEGER
);

CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  rating REAL,
  price_per_night INTEGER,
  amenities TEXT, -- JSON string e.g. '["WiFi", "Breakfast"]'
  booking_url TEXT
);
