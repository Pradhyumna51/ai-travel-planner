const geminiService = require('./geminiService');
const budgetService = require('./budgetService');

async function generateItinerary(tripData) {
  if (!tripData.destination) {
    throw new Error('Destination required');
  }
  if (!tripData.origin) {
    throw new Error('Origin city required');
  }
  if (!tripData.start_date || !tripData.end_date) {
    throw new Error('Start date and end date are required');
  }

  const start = new Date(tripData.start_date);
  const end = new Date(tripData.end_date);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid dates provided');
  }

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of end date

  if (diffDays <= 0) {
    throw new Error('End date must be on or after start date');
  }

  const tripWithDuration = {
    ...tripData,
    duration_days: diffDays
  };

  // Generate itinerary using Gemini (with database mock fallback)
  const aiResponse = await geminiService.generateItineraryWithAI(tripWithDuration);

  // Return complete response object
  return {
    trip: {
      origin: tripWithDuration.origin,
      destination: tripWithDuration.destination,
      start_date: tripWithDuration.start_date,
      end_date: tripWithDuration.end_date,
      duration_days: diffDays,
      budget: tripWithDuration.budget,
      travelers: tripWithDuration.travelers,
      interests: tripWithDuration.interests
    },
    itinerary: aiResponse.itinerary,
    hotels: aiResponse.hotels,
    transportation: aiResponse.transportation,
    budget_breakdown: aiResponse.budget_breakdown
  };
}

module.exports = {
  generateItinerary
};
