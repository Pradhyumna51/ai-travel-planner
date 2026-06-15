const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../travel_planner.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  
  db.all('SELECT * FROM trips', [], (err, trips) => {
    if (err) {
      console.error('Error reading trips:', err.message);
      return;
    }
    console.log('--- SAVED TRIPS ---');
    console.log(trips);

    db.all('SELECT * FROM itineraries', [], (err, items) => {
      if (err) {
        console.error('Error reading itineraries:', err.message);
        return;
      }
      console.log('--- SAVED ITINERARY DAYS ---');
      console.log(`Total days saved: ${items.length}`);
      if (items.length > 0) {
        console.log('Sample Day 1:', items[0]);
      }
      db.close();
    });
  });
});
