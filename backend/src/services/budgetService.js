const geminiService = require('./geminiService');

const DESTINATION_COSTS = {
  "tokyo": { hotel: 4000, food: 2000, activities: 2000 },
  "kyoto": { hotel: 3000, food: 1500, activities: 1500 },
  "new york": { hotel: 8000, food: 3000, activities: 3000 },
  "paris": { hotel: 6000, food: 2500, activities: 2000 },
  "goa": { hotel: 1500, food: 800, activities: 1000 },
  "japan": { hotel: 4000, food: 2000, activities: 2000 } // fallback for country-level input
};

async function estimateBudget(destination, durationDays, travelers, startDate, endDate) {
  const destClean = (destination || "").toLowerCase().trim();
  let costs = null;
  let dynamicTransport = null;

  // Always attempt dynamic AI estimation to capture season, travel costs, trends
  const aiCosts = await geminiService.estimateBudgetWithAI(destination, travelers, durationDays, startDate, endDate);
  if (aiCosts && typeof aiCosts.hotel === 'number' && typeof aiCosts.food === 'number' && typeof aiCosts.activities === 'number') {
    costs = aiCosts;
    dynamicTransport = aiCosts.transport;
  }

  // Fallback to local DB costs if AI is offline
  if (!costs) {
    costs = DESTINATION_COSTS[destClean] || { hotel: 3000, food: 1500, activities: 1500 };
  }

  // Double room sharing logic: 1 room for every 2 travelers
  const roomsCount = Math.ceil(travelers / 2);
  const lodgingCost = costs.hotel * roomsCount * durationDays;
  const foodCost = costs.food * travelers * durationDays;
  const activitiesCost = costs.activities * travelers * durationDays;

  // Use dynamic transport if provided by Gemini, else fallback to 1500 per traveler per day
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
