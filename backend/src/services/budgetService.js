const geminiService = require('./geminiService');

const DESTINATION_COSTS = {
  "tokyo": { hotel: 4000, food: 2000, activities: 2000 },
  "kyoto": { hotel: 3000, food: 1500, activities: 1500 },
  "new york": { hotel: 8000, food: 3000, activities: 3000 },
  "paris": { hotel: 6000, food: 2500, activities: 2000 },
  "goa": { hotel: 1500, food: 800, activities: 1000 },
  "japan": { hotel: 4000, food: 2000, activities: 2000 } // fallback for country-level input
};

async function estimateBudget(destination, durationDays, travelers) {
  const destClean = (destination || "").toLowerCase().trim();
  let costs = DESTINATION_COSTS[destClean];
  
  if (!costs) {
    const aiCosts = await geminiService.estimateBudgetWithAI(destination);
    if (aiCosts && typeof aiCosts.hotel === 'number' && typeof aiCosts.food === 'number' && typeof aiCosts.activities === 'number') {
      costs = aiCosts;
    } else {
      costs = { hotel: 3000, food: 1500, activities: 1500 };
    }
  }
  
  const dailyCost = (costs.hotel + costs.food + costs.activities) * travelers;
  const tripCost = dailyCost * durationDays;
  const transport = durationDays * 2000;
  const contingency = (tripCost + transport) * 0.1;
  const total = tripCost + transport + contingency;
  
  return {
    low: Math.round(total * 0.95),
    high: Math.round(total * 1.15)
  };
}

module.exports = {
  estimateBudget
};
