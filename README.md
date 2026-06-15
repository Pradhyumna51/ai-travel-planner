# ROAM — AI Travel Planner

Dark-themed travel itinerary generator. Enter trip details, get a complete day-by-day plan with hotels, transport, and budget breakdown.


## Tech Stack

**Frontend:** React 18 + Vite, custom CSS (dark mode design system)
**Backend:** Node.js + Express, SQLite3, Gemini API (falls back to DB-driven mock)

## Quick Start

### 1. Start Servers

```
start.bat
```

Opens two windows — backend (port 5000) + frontend (port 5173).

### 2. Stop Servers

```
stop.bat
```

### 3. Manual Start

```bash
# Backend
cd backend && npm install && npm start

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173` in browser.

## API Key

Set in `backend/.env`:
 
```
GEMINI_API_KEY=your_key_here
```
 
No key needed for testing — automatically uses mock data from SQLite database (cities: Tokyo, Kyoto, New York, Paris, Goa). If a city is not in the list, budget verification and itinerary generation dynamically query the Gemini API (falling back to default templates if the API is offline/keyless).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/trips/validate-budget` | Budget check |
| POST | `/api/trips/generate` | Generate itinerary |
| POST | `/api/trips/save` | Save trip to DB |

## Project Structure

```
travel-planner/
├── start.bat / stop.bat
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── controllers/tripController.js
│   │   ├── services/openaiService.js    ← Gemini integration
│   │   ├── services/budgetService.js
│   │   ├── services/itineraryService.js
│   │   └── database/db.js
│   └── travel_planner.db
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css                    ← Dark mode design system
    │   ├── components/
    │   │   ├── TripForm.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   ├── BudgetValidator.jsx
    │   │   ├── ItineraryResults.jsx
    │   │   └── BudgetBreakdown.jsx
    │   └── services/api.js
    └── index.html
```

## Features

- Dark mode UI (airport lounge theme)
- Collapsible city-grouped itinerary timeline
- Hotel cards with star ratings & amenities badges
- Transport route segments
- Fuel-gauge budget breakdown
- Budget validator modal
- Multi-stage journey assembly animation
- Database-driven mock fallback
