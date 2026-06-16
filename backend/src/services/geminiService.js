const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');
const db = require('../database/db');

let genAI = null;
const hasValidKey = config.gemini_api_key && config.gemini_api_key.length > 10;

if (hasValidKey) {
  genAI = new GoogleGenerativeAI(config.gemini_api_key);
}

async function generateItineraryWithAI(tripData) {
  if (!hasValidKey) {
    console.log('No valid Gemini API key. Generating mock database-driven itinerary...');
    return generateMockItinerary(tripData);
  }

  const prompt = `
You are an expert travel planner. Generate a detailed, day-by-day travel itinerary.

Trip Details:
- Origin: ${tripData.origin}
- Destination: ${tripData.destination}
- Duration: ${tripData.duration_days} days
- Budget: ₹${tripData.budget}
- Travelers: ${tripData.travelers}
- Interests: ${tripData.interests.join(', ')}
- Travel Style: ${tripData.travel_style || 'standard'} (options: budget, standard, luxury)

Tailor the generated itinerary, hotel recommendations, activities, and budget breakdown strictly to the requested Travel Style:
- "budget": Recommend extremely affordable hotels/hostels/guesthouses, local cheap eats/street food, public transit/trains, and low-cost/free sightseeing. Keep the total budget breakdown minimal.
- "luxury": Recommend high-end 5-star hotels/resorts, fine-dining, premium private tours/activities, and flights/private cabs. The budget breakdown should reflect premium luxury costs.
- "standard": Recommend comfortable mid-range 3-star hotels, local restaurants, standard popular sights, and standard transport options.

For each day, provide:
1. City/Location
2. Morning activity (with description)
3. Afternoon activity (with description)
4. Evening activity (with description)
5. Estimated daily cost

Also recommend:
- 3-5 hotels in each city (with nightly rates)
- Transportation between cities
- A detailed budget breakdown

You MUST return the response strictly as a clean JSON object. Do not include markdown code block formatting (like \`\`\`json). The JSON must match this structure exactly:
{
  "itinerary": [
    {
      "day": 1,
      "city": "City Name",
      "title": "Day Title",
      "morning_venue": "Morning Attraction Name",
      "morning": "Morning activity description...",
      "afternoon_venue": "Afternoon Attraction Name",
      "afternoon": "Afternoon activity description...",
      "evening_venue": "Evening Attraction Name",
      "evening": "Evening activity description...",
      "estimated_cost": 5000
    }
  ],
  "hotels": [
    {
      "city": "City Name",
      "name": "Hotel Name",
      "rating": 4.5,
      "price_per_night": 6000,
      "amenities": ["WiFi", "Breakfast"],
      "booking_url": "https://..."
    }
  ],
  "transportation": [
    {
      "from": "City A",
      "to": "City B",
      "mode": "Train",
      "duration": "2h 15m",
      "cost": 15000,
      "booking_url": "https://..."
    }
  ],
  "budget_breakdown": {
    "flights": 70000,
    "hotels": 80000,
    "food": 40000,
    "transport": 20000,
    "activities": 30000,
    "contingency": 10000,
    "total": 250000
  }
}
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    const cleanJson = text.replace(/^```json\s*|```$/g, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      console.log('Rate limited. Waiting 10s then retrying once...');
      await new Promise(r => setTimeout(r, 10000));
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();
        const cleanJson = text.replace(/^```json\s*|```$/g, '');
        return JSON.parse(cleanJson);
      } catch (retryErr) {
        console.error('Retry also failed:', retryErr.message);
      }
    }
    console.log('Falling back to mock itinerary generator...');
    return generateMockItinerary(tripData);
  }
}

async function generateMockItinerary(tripData) {
  return new Promise((resolve, reject) => {
    const dest = tripData.destination;
    let searchCity = dest.trim().replace(/\b\w/g, c => c.toUpperCase());
    const destLower = dest.toLowerCase();
    if (destLower.includes('tokyo') || destLower.includes('japan')) searchCity = 'Tokyo';
    else if (destLower.includes('kyoto')) searchCity = 'Kyoto';
    else if (destLower.includes('york') || destLower.includes('ny')) searchCity = 'New York';
    else if (destLower.includes('paris')) searchCity = 'Paris';
    else if (destLower.includes('goa')) searchCity = 'Goa';

    db.all('SELECT * FROM hotels WHERE city = ?', [searchCity], (err, dbHotels) => {
      if (err) return reject(err);

      db.all('SELECT * FROM attractions WHERE city = ?', [searchCity], (err, dbAttractions) => {
        if (err) return reject(err);

        const style = tripData.travel_style || 'standard';
        let multiplier = 1.0;
        if (style === 'budget') multiplier = 0.5;
        else if (style === 'luxury') multiplier = 2.0;

        const hotels = dbHotels.length > 0 ? dbHotels.map(h => ({
          city: h.city,
          name: h.name,
          rating: h.rating,
          price_per_night: Math.round(h.price_per_night * multiplier),
          amenities: JSON.parse(h.amenities || '[]'),
          booking_url: h.booking_url || 'https://www.booking.com'
        })) : [
          { city: searchCity, name: 'Default Grand Hotel', rating: 4.2, price_per_night: Math.round(5000 * multiplier), amenities: ['WiFi', 'Pool'], booking_url: 'https://www.booking.com' }
        ];

        const attractions = dbAttractions.length > 0 ? dbAttractions : [
          { name: 'City Center Park', category: 'Nature', description: 'A lovely park in the middle of the city.', estimated_cost: 0 },
          { name: 'Local Historical Museum', category: 'History', description: 'Museum detailing the historical origins.', estimated_cost: 500 },
          { name: 'Street Food Market', category: 'Food', description: 'Excellent options for tasting native delicacies.', estimated_cost: 1000 }
        ];

        const itinerary = [];
        const duration = tripData.duration_days;

        for (let d = 1; d <= duration; d++) {
          const matchingAttrs = attractions.filter(a => tripData.interests.includes(a.category));
          const pool = matchingAttrs.length >= 3 ? matchingAttrs : attractions;

          const idxM = (d * 3 - 3) % pool.length;
          const idxA = (d * 3 - 2) % pool.length;
          const idxE = (d * 3 - 1) % pool.length;

          const morningAttr = pool[idxM];
          const afternoonAttr = pool[idxA];
          let eveningAttr = pool[idxE];
          if (eveningAttr.name === morningAttr.name && pool.length > 1) {
            eveningAttr = pool[(idxE + 1) % pool.length];
          }

          const dailyCost = Math.round(((morningAttr.estimated_cost || 0) + (afternoonAttr.estimated_cost || 0) + (eveningAttr.estimated_cost || 0) + 1500) * multiplier);

          itinerary.push({
            day: d,
            city: searchCity,
            title: d === 1 ? `Arrival in ${searchCity}` : d === duration ? `Farewell ${searchCity}` : `Exploring ${searchCity} Attractions`,
            morning_venue: morningAttr.name,
            morning: `Visit ${morningAttr.name}. ${morningAttr.description || 'Enjoy sightseeing and taking photos in the morning area.'}`,
            afternoon_venue: afternoonAttr.name,
            afternoon: `Explore ${afternoonAttr.name}. ${afternoonAttr.description || 'Spend your afternoon experiencing local spots and cultures.'}`,
            evening_venue: eveningAttr.name,
            evening: `Relax at ${eveningAttr.name}. ${eveningAttr.description || 'Wind down your day with dining and walking around the neighborhood.'}`,
            estimated_cost: dailyCost
          });
        }

        const transportation = [];
        if (searchCity !== tripData.origin) {
          const transMultiplier = style === 'budget' ? 0.4 : style === 'luxury' ? 1.8 : 1.0;
          transportation.push({
            from: tripData.origin,
            to: searchCity,
            mode: style === 'budget' ? 'Train' : 'Flight',
            duration: style === 'budget' ? '18h 30m' : '6h 30m',
            cost: Math.round(30000 * tripData.travelers * transMultiplier),
            booking_url: style === 'budget' ? 'https://www.irctc.co.in' : 'https://www.google.com/travel/flights'
          });
          if (searchCity === 'Kyoto' && tripData.origin.toLowerCase().includes('tokyo')) {
            transportation[0] = {
              from: 'Tokyo',
              to: 'Kyoto',
              mode: 'Train',
              duration: '2h 15m',
              cost: Math.round(15000 * tripData.travelers * transMultiplier),
              booking_url: 'https://www.shinkansen.com'
            };
          }
        }

        const flightCost = transportation.find(t => t.mode === 'Flight')?.cost || 0;
        const trainCost = transportation.find(t => t.mode === 'Train')?.cost || 0;
        const transitCost = trainCost || (duration * 800 * tripData.travelers);

        const avgHotelPrice = hotels[0]?.price_per_night || 5000;
        const lodgingCost = avgHotelPrice * duration * tripData.travelers;

        const foodCost = duration * 1500 * tripData.travelers;

        const activitiesCost = itinerary.reduce((sum, day) => sum + day.estimated_cost, 0);

        const subtotal = flightCost + transitCost + lodgingCost + foodCost + activitiesCost;
        const contingencyCost = Math.round(subtotal * 0.1);
        const total = subtotal + contingencyCost;

        const budget_breakdown = {
          flights: flightCost,
          hotels: lodgingCost,
          food: foodCost,
          transport: transitCost,
          activities: activitiesCost,
          contingency: contingencyCost,
          total: total
        };

        resolve({
          itinerary,
          hotels: hotels.slice(0, 4),
          transportation,
          budget_breakdown
        });
      });
    });
  });
}

async function estimateBudgetWithAI(destination, travelers, durationDays, startDate, endDate, travelStyle = 'standard') {
  if (!hasValidKey) {
    return null;
  }
  const prompt = `
You are a travel budget expert. Estimate the average travel costs for:
- Destination: "${destination}"
- Travelers: ${travelers}
- Duration: ${durationDays} days
- Date range: ${startDate || 'N/A'} to ${endDate || 'N/A'}
- Travel Style: "${travelStyle}" (options: budget, standard, luxury)

Adjust all costs to match the requested Travel Style:
- "budget": lowest possible costs (backpacker hostels, street food, public transport/trains, free/cheap activities).
- "standard": mid-range comfort (3-star hotels, casual restaurants, standard attractions, cabs/flights).
- "luxury": high-end comfort (4/5-star luxury hotels, fine dining, premium private tours, flights/first-class transport).

Consider the season/time of year (e.g. peak vs off-peak season for this destination), current real-world travel trends, flight/train fares, hotel rates, and daily food/activities costs.
We need realistic estimates in Indian Rupees (INR).

You MUST return the response strictly as a clean JSON object. Do not include markdown code block formatting (like \`\`\`json). The JSON must match this structure exactly:
{
  "hotel": 3000,          // Average nightly rate for rooms needed for ${travelers} travelers
  "food": 1500,           // Daily food cost per person
  "activities": 1500,     // Daily activities/sightseeing cost per person
  "transport": 10000      // Total transport cost (flights/trains/local cabs) for ALL ${travelers} travelers for the entire trip duration
}
`;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanJson = text.replace(/^```json\s*|```$/g, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error estimating budget with Gemini:', error.message);
    return null;
  }
}

module.exports = {
  generateItineraryWithAI,
  estimateBudgetWithAI
};
