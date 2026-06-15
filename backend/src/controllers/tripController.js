const itineraryService = require('../services/itineraryService');
const budgetService = require('../services/budgetService');
const db = require('../database/db');

async function validateBudget(req, res, next) {
  try {
    const { destination, travelers, budget, duration_days, start_date, end_date } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination required' });
    }
    if (!travelers || travelers < 1) {
      return res.status(400).json({ error: 'Number of travelers must be at least 1' });
    }
    if (!budget || budget <= 0) {
      return res.status(400).json({ error: 'Budget must be greater than 0' });
    }

    let duration = parseInt(duration_days);
    if (isNaN(duration) && start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ error: 'Valid trip duration is required' });
    }

    const estimate = budgetService.estimateBudget(destination, duration, parseInt(travelers));
    const isBudgetValid = budget >= estimate.low;

    let message = 'Your budget is sufficient for this trip.';
    let recommendation = 'You are good to go! Keep some cash for emergencies.';

    if (!isBudgetValid) {
      message = `Your ₹${budget.toLocaleString('en-IN')} budget for ${duration} days in ${destination} is significantly lower than realistic estimates.`;
      recommendation = `Consider increasing budget to ₹${estimate.low.toLocaleString('en-IN')} - ₹${estimate.high.toLocaleString('en-IN')} for comfortable travel.`;
    }

    return res.status(200).json({
      isValid: isBudgetValid,
      estimatedBudget: {
        low: estimate.low,
        high: estimate.high
      },
      message,
      recommendation
    });
  } catch (error) {
    next(error);
  }
}

async function generateItinerary(req, res, next) {
  try {
    const { origin, destination, start_date, end_date, budget, travelers, interests } = req.body;

    // Validation
    if (!origin) return res.status(400).json({ error: 'Origin city is required' });
    if (!destination) return res.status(400).json({ error: 'Destination city is required' });
    if (!start_date || !end_date) return res.status(400).json({ error: 'Start and end dates are required' });
    if (!budget || budget <= 0) return res.status(400).json({ error: 'Budget must be greater than 0' });
    if (!travelers || travelers < 1 || travelers > 20) return res.status(400).json({ error: 'Travelers must be between 1 and 20' });
    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: 'At least one interest must be selected' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end < start) {
      return res.status(400).json({ error: 'Invalid dates', details: 'End date must be after start date' });
    }

    const response = await itineraryService.generateItinerary({
      origin,
      destination,
      start_date,
      end_date,
      budget: parseInt(budget),
      travelers: parseInt(travelers),
      interests
    });

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function saveTrip(req, res, next) {
  try {
    const { trip, itinerary } = req.body;

    if (!trip || !itinerary || !Array.isArray(itinerary)) {
      return res.status(400).json({ error: 'Invalid payload. Expecting trip details and itinerary array.' });
    }

    // Insert into trips table
    const tripQuery = `
      INSERT INTO trips (user_id, origin, destination, start_date, end_date, duration_days, budget, travelers, interests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const userId = trip.user_id || null;
    const interestsJson = JSON.stringify(trip.interests || []);

    db.run(
      tripQuery,
      [
        userId,
        trip.origin,
        trip.destination,
        trip.start_date,
        trip.end_date,
        trip.duration_days,
        trip.budget,
        trip.travelers,
        interestsJson
      ],
      function (err) {
        if (err) {
          return next(err);
        }

        const tripId = this.lastID;
        
        // Prepare itineraries batch insertion
        const itiQuery = `
          INSERT INTO itineraries (trip_id, day_number, city, title, morning_activity, afternoon_activity, evening_activity, estimated_cost)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.serialize(() => {
          const stmt = db.prepare(itiQuery);
          itinerary.forEach((day) => {
            stmt.run(
              tripId,
              day.day,
              day.city,
              day.title || `Day ${day.day}`,
              day.morning || '',
              day.afternoon || '',
              day.evening || '',
              day.estimated_cost || 0
            );
          });
          stmt.finalize((err) => {
            if (err) {
              return next(err);
            }
            return res.status(201).json({
              success: true,
              tripId,
              message: 'Trip saved successfully'
            });
          });
        });
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateBudget,
  generateItinerary,
  saveTrip
};
