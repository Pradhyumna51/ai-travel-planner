const db = require('../database/db');
const cache = new Map();

/**
 * Sleeps for a given number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Queries database for cached attractions
 */
function queryDbForAttraction(name) {
  return new Promise((resolve) => {
    db.get(
      'SELECT latitude, longitude, address FROM attractions WHERE name = ? OR name LIKE ? LIMIT 1',
      [name, `%${name}%`],
      (err, row) => {
        if (err || !row) {
          resolve(null);
        } else {
          resolve(row);
        }
      }
    );
  });
}

/**
 * Geocodes an address or place name using OpenStreetMap Nominatim API
 */
async function geocodeAddress(placeName, city) {
  const query = `${placeName}, ${city}`.trim();
  if (cache.has(query)) {
    console.log(`Geocoding cache hit for: ${query}`);
    return cache.get(query);
  }

  // 1. Try DB lookup first
  try {
    const dbRow = await queryDbForAttraction(placeName);
    if (dbRow && dbRow.latitude && dbRow.longitude) {
      console.log(`Geocoding database hit for: ${placeName} -> ${dbRow.latitude}, ${dbRow.longitude}`);
      const result = {
        latitude: dbRow.latitude,
        longitude: dbRow.longitude,
        address: dbRow.address || `${placeName}, ${city}`
      };
      cache.set(query, result);
      return result;
    }
  } catch (dbErr) {
    console.error('Error querying local db for geocoding:', dbErr.message);
  }

  // 2. Query Nominatim
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  
  try {
    // Respect Nominatim's rate limit of 1 request per second
    await sleep(1000);
    
    console.log(`Querying Nominatim for: ${query}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RoamTravelPlanner/1.0 (contact: travel@planner.local)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`);
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: data[0].display_name
      };
      cache.set(query, result);
      return result;
    }
    
    // If exact place fails, try geocoding only the city to get center point
    if (placeName !== city) {
      console.log(`Failed to geocode place, attempting city fallback for: ${city}`);
      return await geocodeAddress(city, city);
    }

    return null;
  } catch (error) {
    console.error(`Geocoding error for ${query}:`, error.message);
    return null;
  }
}

module.exports = {
  geocodeAddress
};
