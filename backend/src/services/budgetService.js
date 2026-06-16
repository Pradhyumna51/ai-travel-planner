const geminiService = require('./geminiService');

const DESTINATION_COSTS = {
  "tokyo": { hotel: 4000, food: 2000, activities: 2000 },
  "kyoto": { hotel: 3000, food: 1500, activities: 1500 },
  "new york": { hotel: 8000, food: 3000, activities: 3000 },
  "paris": { hotel: 6000, food: 2500, activities: 2000 },
  "goa": { hotel: 1500, food: 800, activities: 1000 },
  "japan": { hotel: 4000, food: 2000, activities: 2000 } // fallback for country-level input
};

async function estimateBudget(destination, durationDays, travelers, startDate, endDate, travelStyle = 'standard') {
  const destClean = (destination || "").toLowerCase().trim();
  let costs = null;
  let dynamicTransport = null;

  // Always attempt dynamic AI estimation to capture season, travel costs, trends, and travel style
  const aiCosts = await geminiService.estimateBudgetWithAI(destination, travelers, durationDays, startDate, endDate, travelStyle);
  if (aiCosts && typeof aiCosts.hotel === 'number' && typeof aiCosts.food === 'number' && typeof aiCosts.activities === 'number') {
    costs = aiCosts;
    dynamicTransport = aiCosts.transport;
  }

  // Fallback to local DB costs if AI is offline
  if (!costs) {
    const foreignDestinations = ["tokyo", "kyoto", "new york", "paris", "japan", "usa", "france", "london", "europe", "uk", "america", "ny"];
    const isForeign = foreignDestinations.some(f => destClean.includes(f));

    let baseCosts;
    if (isForeign) {
      baseCosts = DESTINATION_COSTS[destClean] || { hotel: 4000, food: 2000, activities: 2000 };
    } else {
      // Domestic Indian/local defaults (much lower cost)
      baseCosts = DESTINATION_COSTS[destClean] || { hotel: 1200, food: 600, activities: 500 };
    }

    // Apply multipliers based on style
    let styleMultiplier = { hotel: 1.0, food: 1.0, activities: 1.0, transport: 1.0 };
    if (travelStyle === 'budget') {
      styleMultiplier = { hotel: 0.4, food: 0.6, activities: 0.5, transport: 0.5 };
    } else if (travelStyle === 'luxury') {
      styleMultiplier = { hotel: 2.5, food: 2.0, activities: 2.0, transport: 1.8 };
    }

    costs = {
      hotel: baseCosts.hotel * styleMultiplier.hotel,
      food: baseCosts.food * styleMultiplier.food,
      activities: baseCosts.activities * styleMultiplier.activities
    };

    const baseTransportPerDay = isForeign ? 1500 : 800;
    dynamicTransport = durationDays * baseTransportPerDay * travelers * styleMultiplier.transport;
  }

  // Double room sharing logic: 1 room for every 2 travelers
  const roomsCount = Math.ceil(travelers / 2);
  const lodgingCost = costs.hotel * roomsCount * durationDays;
  const foodCost = costs.food * travelers * durationDays;
  const activitiesCost = costs.activities * travelers * durationDays;

  // Use dynamic transport if provided by Gemini, else fallback
  const transportCost = (typeof dynamicTransport === 'number') ? dynamicTransport : (durationDays * 1500 * travelers);

  const subtotal = lodgingCost + foodCost + activitiesCost + transportCost;
  const contingency = subtotal * 0.1;
  const total = subtotal + contingency;

  return {
    low: Math.round(total * 0.9),
    high: Math.round(total * 1.1)
  };
}

module.exports = {
  estimateBudget
};
