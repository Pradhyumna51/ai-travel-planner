/**
 * Formats OSRM steps into turn-by-turn instructions
 */
function getTurnsFromRouteJson(routeJsonStr) {
  try {
    const routeData = JSON.parse(routeJsonStr);
    const mainRoute = routeData.routes[0];
    
    const legs = [];
    
    mainRoute.legs.forEach((leg, legIdx) => {
      const startWp = routeData.waypoints[legIdx];
      const endWp = routeData.waypoints[legIdx + 1];
      
      const steps = (leg.steps || []).map(step => {
        // Clean up step instructions or generate standard maneuvers if missing
        let instruction = step.instruction;
        if (!instruction && step.maneuver) {
          const mType = step.maneuver.type || 'straight';
          const modifier = step.maneuver.modifier ? ` ${step.maneuver.modifier}` : '';
          instruction = `${mType.toUpperCase()}${modifier.toUpperCase()} for ${step.distance}m`;
        }
        
        return {
          distance_m: Math.round(step.distance),
          duration_s: Math.round(step.duration),
          instruction: instruction || 'Walk straight',
          maneuver: step.maneuver?.type || 'straight'
        };
      });
      
      legs.push({
        from: startWp?.name || `Point ${legIdx + 1}`,
        to: endWp?.name || `Point ${legIdx + 2}`,
        distance_m: Math.round(leg.distance),
        duration_s: Math.round(leg.duration),
        steps
      });
    });
    
    return {
      distance_m: Math.round(mainRoute.distance),
      duration_s: Math.round(mainRoute.duration),
      legs
    };
  } catch (error) {
    console.error('Error parsing route steps:', error.message);
    return null;
  }
}

module.exports = {
  getTurnsFromRouteJson
};
