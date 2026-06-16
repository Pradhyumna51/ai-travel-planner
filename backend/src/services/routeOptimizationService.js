const turf = require('@turf/turf');

// OSRM walking router URL
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/walking';

/**
 * Solves Traveling Salesman Problem (TSP) using Nearest Neighbor
 */
function solveNearestNeighbor(startPoint, attractions, endPoint) {
  const unvisited = [...attractions];
  let current = startPoint;
  const optimizedOrder = [];
  
  while (unvisited.length > 0) {
    let nearestIdx = -1;
    let minDistance = Infinity;
    
    for (let i = 0; i < unvisited.length; i++) {
      const fromPoint = turf.point([current.longitude, current.latitude]);
      const toPoint = turf.point([unvisited[i].longitude, unvisited[i].latitude]);
      const dist = turf.distance(fromPoint, toPoint);
      
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }
    
    const nextAttraction = unvisited.splice(nearestIdx, 1)[0];
    optimizedOrder.push(nextAttraction);
    current = nextAttraction;
  }
  
  return optimizedOrder;
}

/**
 * Calls OSRM API to get exact walking path, distance, and duration
 */
async function fetchOSRMRoute(waypoints) {
  const coords = waypoints.map(w => `${w.longitude},${w.latitude}`).join(';');
  const url = `${OSRM_BASE_URL}/${coords}?overview=full&geometries=geojson&steps=true`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API returned status ${response.status}`);
    }
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM routing failed: ${data.message || 'No route found'}`);
    }
    return data;
  } catch (error) {
    console.error('OSRM Fetch Error:', error.message);
    return null;
  }
}

/**
 * Fallback route generation using straight line distance
 */
function generateFallbackRoute(waypoints) {
  let totalDistanceM = 0;
  const coordinates = [];
  
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    coordinates.push([wp.longitude, wp.latitude]);
    
    if (i > 0) {
      const prev = waypoints[i - 1];
      const fromPoint = turf.point([prev.longitude, prev.latitude]);
      const toPoint = turf.point([wp.longitude, wp.latitude]);
      const distKm = turf.distance(fromPoint, toPoint);
      totalDistanceM += distKm * 1000;
    }
  }
  
  // Standard walking speed: 5 km/h = 1.39 m/s = 83 m/min
  const totalDurationMin = Math.round(totalDistanceM / 83.3);
  
  // Create mock OSRM JSON format
  const mockRouteJson = {
    routes: [{
      distance: totalDistanceM,
      duration: totalDurationMin * 60,
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      },
      legs: waypoints.slice(1).map((wp, idx) => {
        const prev = waypoints[idx];
        const fromPoint = turf.point([prev.longitude, prev.latitude]);
        const toPoint = turf.point([wp.longitude, wp.latitude]);
        const legDistM = Math.round(turf.distance(fromPoint, toPoint) * 1000);
        const legDurS = Math.round(legDistM / 1.39);
        return {
          distance: legDistM,
          duration: legDurS,
          steps: [{
            distance: legDistM,
            duration: legDurS,
            instruction: `Walk from ${prev.name} to ${wp.name}`,
            maneuver: { type: 'straight' }
          }]
        };
      })
    }],
    waypoints: waypoints.map(w => ({ name: w.name, location: [w.longitude, w.latitude] }))
  };
  
  return mockRouteJson;
}

/**
 * Optimizes the route and generates routing path
 */
async function optimizeAndGenerateRoute(startPoint, attractions, endPoint) {
  // 1. Solve TSP via Nearest Neighbor
  const optimizedAttractions = solveNearestNeighbor(startPoint, attractions, endPoint);
  
  // 2. Build full waypoint array (Start -> Attractions -> End)
  const fullWaypoints = [startPoint, ...optimizedAttractions, endPoint];
  
  // 3. Get routing path geometry
  let routeData = await fetchOSRMRoute(fullWaypoints);
  let isFallback = false;
  
  if (!routeData) {
    console.log('Using straight-line fallback route for optimization...');
    routeData = generateFallbackRoute(fullWaypoints);
    isFallback = true;
  }
  
  const mainRoute = routeData.routes[0];
  const polylineGeoJSON = JSON.stringify(mainRoute.geometry);
  
  return {
    optimizedAttractions,
    totalDistanceM: Math.round(mainRoute.distance),
    totalWalkingTimeMin: Math.round(mainRoute.duration / 60),
    polyline: polylineGeoJSON,
    routeJson: JSON.stringify(routeData),
    isFallback
  };
}

module.exports = {
  optimizeAndGenerateRoute
};
