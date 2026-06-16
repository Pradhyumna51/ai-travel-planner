const db = require('../database/db');
const geocodingService = require('./geocodingService');
const routeOptimizationService = require('./routeOptimizationService');
const directionsService = require('./directionsService');

// Promise wrappers
const dbGet = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
const dbAll = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
const dbRun = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function(err) { err ? rej(err) : res(this); }));

/**
 * Finds or creates an attraction entry in the attractions table
 */
async function findOrCreateAttraction(name, city, latitude, longitude, address) {
  try {
    const row = await dbGet('SELECT id FROM attractions WHERE name = ? COLLATE NOCASE', [name]);
    if (row) {
      return row.id;
    }
    const result = await dbRun(
      'INSERT INTO attractions (name, city, category, description, latitude, longitude, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, city, 'Sightseeing', 'Auto-geocoded attraction', latitude, longitude, address || '']
    );
    return result.lastID;
  } catch (err) {
    console.error(`Error in findOrCreateAttraction for ${name}:`, err.message);
    // Return a dummy ID if insertion fails, or query again
    const fallbackRow = await dbGet('SELECT id FROM attractions WHERE name = ? COLLATE NOCASE', [name]);
    return fallbackRow ? fallbackRow.id : 1;
  }
}

/**
 * Generates and saves map data for a single itinerary day
 */
async function generateAndSaveTripMapDataForDay(tripId, itineraryId, dayObj) {
  const { day: dayNumber, city, morning_venue, afternoon_venue, evening_venue } = dayObj;

  console.log(`Generating map data for Trip ${tripId}, Day ${dayNumber} in ${city}...`);

  // 1. Get hotel coordinate
  let hotelName = 'Hotel';
  let hotelLat = 0;
  let hotelLng = 0;
  
  try {
    const dbHotel = await dbGet('SELECT name FROM hotels WHERE city = ? LIMIT 1', [city]);
    if (dbHotel) {
      hotelName = dbHotel.name;
    }
    const hotelCoord = await geocodingService.geocodeAddress(hotelName, city);
    if (hotelCoord) {
      hotelLat = hotelCoord.latitude;
      hotelLng = hotelCoord.longitude;
    } else {
      // Fallback to city geocode
      const cityCoord = await geocodingService.geocodeAddress(city, city);
      if (cityCoord) {
        hotelLat = cityCoord.latitude;
        hotelLng = cityCoord.longitude;
      }
    }
  } catch (err) {
    console.error('Error finding/geocoding hotel:', err.message);
  }

  const hotelAttractionId = await findOrCreateAttraction(hotelName, city, hotelLat, hotelLng, `${hotelName}, ${city}`);

  const startPoint = {
    id: hotelAttractionId,
    name: hotelName,
    latitude: hotelLat,
    longitude: hotelLng
  };

  // 2. Geocode venues
  const venueNames = [morning_venue, afternoon_venue, evening_venue].filter(Boolean);
  const attractions = [];

  for (const name of venueNames) {
    const coord = await geocodingService.geocodeAddress(name, city);
    if (coord) {
      const attrId = await findOrCreateAttraction(name, city, coord.latitude, coord.longitude, coord.address);
      attractions.push({
        id: attrId,
        name: name,
        latitude: coord.latitude,
        longitude: coord.longitude
      });
    }
  }

  // If no attractions were successfully geocoded, create a dummy route starting and ending at hotel
  if (attractions.length === 0) {
    await dbRun(
      `UPDATE itineraries SET start_lat = ?, start_lng = ?, total_walking_km = 0, total_walking_time_min = 0, attraction_count = 0, polylines = '[]' WHERE id = ?`,
      [hotelLat, hotelLng, itineraryId]
    );
    return;
  }

  // 3. Optimize route
  const routeResult = await routeOptimizationService.optimizeAndGenerateRoute(startPoint, attractions, startPoint);
  const { optimizedAttractions, totalDistanceM, totalWalkingTimeMin, polyline, routeJson } = routeResult;

  // 4. Save daily attractions in optimized sequence order
  for (let idx = 0; idx < optimizedAttractions.length; idx++) {
    const attr = optimizedAttractions[idx];
    
    let walkingTimeMin = 15; // default fallback
    let distanceM = 1000; // default fallback

    try {
      const routeData = JSON.parse(routeJson);
      const leg = routeData.routes[0].legs[idx];
      if (leg) {
        distanceM = Math.round(leg.distance);
        walkingTimeMin = Math.round(leg.duration / 60);
      }
    } catch (e) {}

    let arrivalTimeStr = '10:00 AM';
    let departureTimeStr = '11:30 AM';
    
    let prevDepMins = 540; // 09:00 AM
    if (idx > 0) {
      let cumMins = 540;
      for (let j = 0; j < idx; j++) {
        let walk = 15;
        try {
          const routeData = JSON.parse(routeJson);
          if (routeData.routes[0].legs[j]) walk = Math.round(routeData.routes[0].legs[j].duration / 60);
        } catch (e) {}
        cumMins += walk + 90; // 90 min visit duration
      }
      prevDepMins = cumMins;
    }

    const arrivalMins = prevDepMins + walkingTimeMin;
    const departureMins = arrivalMins + 90; // 90 min visit duration

    const formatMins = (m) => {
      const hr = Math.floor(m / 60) % 24;
      const min = m % 60;
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const hr12 = hr % 12 || 12;
      return `${hr12.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`;
    };

    arrivalTimeStr = formatMins(arrivalMins);
    departureTimeStr = formatMins(departureMins);

    await dbRun(
      `INSERT INTO daily_attractions (itinerary_id, day_number, attraction_id, sequence_order, arrival_time, departure_time, duration_minutes, distance_from_previous_m, walking_time_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [itineraryId, dayNumber, attr.id, idx + 1, arrivalTimeStr, departureTimeStr, 90, distanceM, walkingTimeMin]
    );
  }

  // 5. Save route legs in routes table
  try {
    const routeData = JSON.parse(routeJson);
    const mainRoute = routeData.routes[0];
    const waypoints = [startPoint, ...optimizedAttractions, startPoint];

    for (let idx = 0; idx < mainRoute.legs.length; idx++) {
      const leg = mainRoute.legs[idx];
      const fromWp = waypoints[idx];
      const toWp = waypoints[idx + 1];
      
      const segmentPolyline = JSON.stringify(leg.geometry || { type: 'LineString', coordinates: [] });

      await dbRun(
        `INSERT INTO routes (itinerary_id, day_number, from_attraction_id, to_attraction_id, distance_meters, walking_time_minutes, polyline, route_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itineraryId,
          dayNumber,
          fromWp.id,
          toWp.id,
          Math.round(leg.distance),
          Math.round(leg.duration / 60),
          segmentPolyline,
          JSON.stringify({ routes: [{ distance: leg.distance, duration: leg.duration, geometry: leg.geometry, legs: [leg] }] })
        ]
      );
    }
  } catch (err) {
    console.error('Error saving routes table legs:', err.message);
  }

  // 6. Update itineraries row with metadata
  const totalWalkingKm = parseFloat((totalDistanceM / 1000).toFixed(2));
  await dbRun(
    `UPDATE itineraries SET start_lat = ?, start_lng = ?, total_walking_km = ?, total_walking_time_min = ?, attraction_count = ?, polylines = ? WHERE id = ?`,
    [hotelLat, hotelLng, totalWalkingKm, totalWalkingTimeMin, optimizedAttractions.length, polyline, itineraryId]
  );
}

/**
 * Generates and saves map data for the whole trip itinerary
 */
async function generateAndSaveTripMapData(tripId, itinerary) {
  try {
    const itinRows = await dbAll('SELECT id FROM itineraries WHERE trip_id = ?', [tripId]);
    const itinIds = itinRows.map(r => r.id);
    
    if (itinIds.length > 0) {
      const placeholders = itinIds.map(() => '?').join(',');
      await dbRun(`DELETE FROM daily_attractions WHERE itinerary_id IN (${placeholders})`, itinIds);
      await dbRun(`DELETE FROM routes WHERE itinerary_id IN (${placeholders})`, itinIds);
    }

    for (const day of itinerary) {
      const itinRow = await dbGet('SELECT id, city FROM itineraries WHERE trip_id = ? AND day_number = ?', [tripId, day.day]);
      if (itinRow) {
        await generateAndSaveTripMapDataForDay(tripId, itinRow.id, {
          day: day.day,
          city: itinRow.city,
          morning_venue: day.morning_venue || '',
          afternoon_venue: day.afternoon_venue || '',
          evening_venue: day.evening_venue || ''
        });
      }
    }
    console.log(`Successfully completed map data generation for Trip ${tripId}`);
  } catch (error) {
    console.error(`Error generating and saving map data for Trip ${tripId}:`, error.message);
  }
}

/**
 * Gets map data for a saved trip, generating it on the fly if missing.
 */
async function getMapDataForTrip(tripId) {
  const trip = await dbGet('SELECT * FROM trips WHERE id = ?', [tripId]);
  if (!trip) return null;

  const itineraries = await dbAll('SELECT * FROM itineraries WHERE trip_id = ? ORDER BY day_number ASC', [tripId]);
  
  const daysData = [];

  for (const itin of itineraries) {
    let daily = await dbAll(`
      SELECT da.*, a.name, a.latitude, a.longitude, a.address, a.category, a.rating, a.image_url
      FROM daily_attractions da
      JOIN attractions a ON da.attraction_id = a.id
      WHERE da.itinerary_id = ? AND da.day_number = ?
      ORDER BY da.sequence_order ASC
    `, [itin.id, itin.day_number]);

    if (daily.length === 0 && (itin.morning_venue || itin.afternoon_venue || itin.evening_venue)) {
      await generateAndSaveTripMapDataForDay(tripId, itin.id, {
        day: itin.day_number,
        city: itin.city,
        morning_venue: itin.morning_venue,
        afternoon_venue: itin.afternoon_venue,
        evening_venue: itin.evening_venue
      });

      daily = await dbAll(`
        SELECT da.*, a.name, a.latitude, a.longitude, a.address, a.category, a.rating, a.image_url
        FROM daily_attractions da
        JOIN attractions a ON da.attraction_id = a.id
        WHERE da.itinerary_id = ? AND da.day_number = ?
        ORDER BY da.sequence_order ASC
      `, [itin.id, itin.day_number]);
    }

    const routes = await dbAll(`
      SELECT r.*, f.name as from_name, f.latitude as from_lat, f.longitude as from_lng,
                   t.name as to_name, t.latitude as to_lat, t.longitude as to_lng
      FROM routes r
      LEFT JOIN attractions f ON r.from_attraction_id = f.id
      LEFT JOIN attractions t ON r.to_attraction_id = t.id
      WHERE r.itinerary_id = ? AND r.day_number = ?
      ORDER BY r.id ASC
    `, [itin.id, itin.day_number]);

    const updatedItin = await dbGet('SELECT * FROM itineraries WHERE id = ?', [itin.id]);

    const formattedAttractions = daily.map(da => {
      let activityDesc = '';
      if (da.sequence_order === 1) activityDesc = itin.morning_activity;
      else if (da.sequence_order === 2) activityDesc = itin.afternoon_activity;
      else if (da.sequence_order === 3) activityDesc = itin.evening_activity;

      return {
        id: da.attraction_id,
        name: da.name,
        latitude: da.latitude,
        longitude: da.longitude,
        category: da.category || 'Sightseeing',
        arrival_time: da.arrival_time,
        departure_time: da.departure_time,
        duration_minutes: da.duration_minutes,
        distance_from_previous_m: da.distance_from_previous_m,
        walking_time_minutes: da.walking_time_minutes,
        address: da.address || '',
        rating: da.rating || 4.0,
        image_url: da.image_url || '',
        description: activityDesc
      };
    });

    const waypoints = [];
    if (updatedItin.start_lat && updatedItin.start_lng) {
      let hotelName = 'Hotel';
      if (routes.length > 0 && routes[0].from_name) {
        hotelName = routes[0].from_name;
      }
      waypoints.push({ lat: updatedItin.start_lat, lng: updatedItin.start_lng, name: hotelName });
    }
    formattedAttractions.forEach(a => {
      waypoints.push({ lat: a.latitude, lng: a.longitude, name: a.name });
    });
    if (updatedItin.start_lat && updatedItin.start_lng) {
      let hotelName = 'Hotel';
      if (routes.length > 0 && routes[routes.length - 1].to_name) {
        hotelName = routes[routes.length - 1].to_name;
      }
      waypoints.push({ lat: updatedItin.start_lat, lng: updatedItin.start_lng, name: hotelName });
    }

    daysData.push({
      day_number: itin.day_number,
      city: itin.city,
      date: new Date(new Date(trip.start_date).getTime() + (itin.day_number - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attractions: formattedAttractions,
      route: {
        polyline: updatedItin.polylines || '',
        total_distance_m: Math.round((updatedItin.total_walking_km || 0) * 1000),
        total_walking_time_min: updatedItin.total_walking_time_min || 0,
        waypoints,
        legs: routes.map(r => ({
          id: r.id,
          from: r.from_name || 'Hotel',
          to: r.to_name || 'Hotel',
          distance_m: r.distance_meters,
          walking_time_min: r.walking_time_minutes
        }))
      },
      summary: {
        walking_km: updatedItin.total_walking_km || 0,
        walking_time_min: updatedItin.total_walking_time_min || 0,
        attraction_count: updatedItin.attraction_count || 0,
        estimated_end_time: formattedAttractions.length > 0 ? formattedAttractions[formattedAttractions.length - 1].departure_time : '05:00 PM'
      }
    });
  }

  return {
    trip: {
      id: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      duration_days: trip.duration_days,
      travelers: trip.travelers,
      budget: trip.budget,
      interests: JSON.parse(trip.interests || '[]')
    },
    days: daysData
  };
}

module.exports = {
  generateAndSaveTripMapData,
  getMapDataForTrip
};
