const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const db = new sqlite3.Database(config.database_path, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', config.database_path);
    initDb();
  }
});

function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // SQLite run multiple statements is not supported via db.run natively without plugins.
  // We split by semicolon.
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  db.serialize(() => {
    statements.forEach((stmt) => {
      db.run(stmt, (err) => {
        if (err) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
            console.error('Error running schema statement:', err.message);
          }
        }
      });
    });

    // Run dynamic migrations for existing tables
    db.all('PRAGMA table_info(itineraries)', (err, rows) => {
      if (err) {
        console.error('Error checking itineraries columns:', err);
        return;
      }
      const columns = (rows || []).map(r => r.name);
      const itineraryCols = [
        { name: 'morning_venue', type: 'TEXT' },
        { name: 'afternoon_venue', type: 'TEXT' },
        { name: 'evening_venue', type: 'TEXT' },
        { name: 'start_lat', type: 'REAL' },
        { name: 'start_lng', type: 'REAL' },
        { name: 'total_walking_km', type: 'REAL' },
        { name: 'total_walking_time_min', type: 'INTEGER' },
        { name: 'attraction_count', type: 'INTEGER' },
        { name: 'polylines', type: 'TEXT' }
      ];
      itineraryCols.forEach(col => {
        if (!columns.includes(col.name)) {
          db.run(`ALTER TABLE itineraries ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err) console.error(`Error adding column ${col.name} to itineraries:`, err.message);
            else console.log(`Added column ${col.name} to itineraries`);
          });
        }
      });
    });

    db.all('PRAGMA table_info(attractions)', (err, rows) => {
      if (err) {
        console.error('Error checking attractions columns:', err);
        return;
      }
      const columns = (rows || []).map(r => r.name);
      const attractionCols = [
        { name: 'address', type: 'TEXT' },
        { name: 'rating', type: 'REAL' },
        { name: 'review_count', type: 'INTEGER' },
        { name: 'image_url', type: 'TEXT' }
      ];
      attractionCols.forEach(col => {
        if (!columns.includes(col.name)) {
          db.run(`ALTER TABLE attractions ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err) console.error(`Error adding column ${col.name} to attractions:`, err.message);
            else console.log(`Added column ${col.name} to attractions`);
          });
        }
      });
    });

    seedData();
  });
}

function seedData() {
  db.get('SELECT COUNT(*) as count FROM attractions', (err, row) => {
    if (err) {
      console.error('Error checking seed data:', err.message);
      return;
    }

    if (row.count > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding database with default attractions and hotels...');

    const sampleAttractions = [
      // TOKYO (10 attractions)
      { name: 'Senso-ji Temple', city: 'Tokyo', category: 'History', description: 'Tokyo oldest and most famous Buddhist temple in Asakusa.', latitude: 35.7148, longitude: 139.7967, average_duration: 90, estimated_cost: 0 },
      { name: 'Shibuya Crossing', city: 'Tokyo', category: 'Photography', description: 'World famous scramble crossing with glowing neon screens.', latitude: 35.6580, longitude: 139.7016, average_duration: 30, estimated_cost: 0 },
      { name: 'Meiji Jingu Shrine', city: 'Tokyo', category: 'Nature', description: 'Serene shrine surrounded by a dense forest in the city center.', latitude: 35.6764, longitude: 139.6993, average_duration: 60, estimated_cost: 0 },
      { name: 'Ghibli Museum', city: 'Tokyo', category: 'Anime', description: 'Charming museum showcasing the work of legendary Studio Ghibli.', latitude: 35.6962, longitude: 139.5704, average_duration: 120, estimated_cost: 1000 },
      { name: 'Akihabara Electric Town', city: 'Tokyo', category: 'Anime', description: 'Mecca for anime, manga, and electronics shopping.', latitude: 35.6997, longitude: 139.7715, average_duration: 180, estimated_cost: 0 },
      { name: 'Golden Gai', city: 'Tokyo', category: 'Nightlife', description: 'Maze of narrow alleys packed with tiny, unique themed bars.', latitude: 35.6938, longitude: 139.7042, average_duration: 120, estimated_cost: 2000 },
      { name: 'Tsukiji Outer Market', city: 'Tokyo', category: 'Food', description: 'Bustling market stalls offering fresh sushi and street food.', latitude: 35.6655, longitude: 139.7702, average_duration: 90, estimated_cost: 1500 },
      { name: 'Tokyo Skytree', city: 'Tokyo', category: 'Adventure', description: 'Tallest structure in Japan with panoramic observation decks.', latitude: 35.7101, longitude: 139.8107, average_duration: 90, estimated_cost: 3100 },
      { name: 'Harajuku Takeshita Street', city: 'Tokyo', category: 'Shopping', description: 'Colorful pedestrian shopping street known for quirky fashion.', latitude: 35.6702, longitude: 139.7032, average_duration: 90, estimated_cost: 0 },
      { name: 'Mount Takao', city: 'Tokyo', category: 'Trekking', description: 'Scenic mountain offering hiking trails just an hour from central Tokyo.', latitude: 35.6251, longitude: 139.2437, average_duration: 240, estimated_cost: 1000 },

      // KYOTO (10 attractions)
      { name: 'Fushimi Inari Taisha', city: 'Kyoto', category: 'Trekking', description: 'Iconic shrine famous for its path of thousands of red torii gates.', latitude: 34.9671, longitude: 135.7727, average_duration: 120, estimated_cost: 0 },
      { name: 'Kinkaku-ji (Golden Pavilion)', city: 'Kyoto', category: 'History', description: 'Zen Buddhist temple covered in brilliant gold leaf.', latitude: 35.0394, longitude: 135.7292, average_duration: 60, estimated_cost: 500 },
      { name: 'Arashiyama Bamboo Grove', city: 'Kyoto', category: 'Nature', description: 'Path winding through towering stalks of green bamboo.', latitude: 35.0156, longitude: 135.6715, average_duration: 60, estimated_cost: 0 },
      { name: 'Kiyomizu-dera Temple', city: 'Kyoto', category: 'History', description: 'Historic temple with a massive wooden stage over the hillside.', latitude: 34.9949, longitude: 135.7850, average_duration: 90, estimated_cost: 400 },
      { name: 'Gion District', city: 'Kyoto', category: 'Nightlife', description: 'Traditional entertainment district where geishas can be spotted.', latitude: 35.0037, longitude: 135.7782, average_duration: 90, estimated_cost: 0 },
      { name: 'Nishiki Market', city: 'Kyoto', category: 'Food', description: 'Five-block shopping street lined with local food vendors.', latitude: 35.0050, longitude: 135.7649, average_duration: 90, estimated_cost: 1000 },
      { name: 'Kyoto International Manga Museum', city: 'Kyoto', category: 'Anime', description: 'Museum housing a huge collection of Japanese comic books.', latitude: 35.0142, longitude: 135.7592, average_duration: 120, estimated_cost: 900 },
      { name: 'Philosophers Path', city: 'Kyoto', category: 'Nature', description: 'Cherry tree-lined canal pathway perfect for quiet strolls.', latitude: 35.0264, longitude: 135.7958, average_duration: 60, estimated_cost: 0 },
      { name: 'Nijo Castle', city: 'Kyoto', category: 'History', description: 'Flatland castle with beautiful gardens and squeaking nightingale floors.', latitude: 35.0142, longitude: 135.7482, average_duration: 90, estimated_cost: 800 },
      { name: 'Kyoto Tower', city: 'Kyoto', category: 'Photography', description: 'Tallest structure in Kyoto offering views of the city and mountains.', latitude: 34.9875, longitude: 135.7593, average_duration: 60, estimated_cost: 800 },

      // NEW YORK (10 attractions)
      { name: 'Central Park', city: 'New York', category: 'Nature', description: 'Massive urban park in Manhattan featuring lakes, trails, and lawns.', latitude: 40.7851, longitude: -73.9683, average_duration: 180, estimated_cost: 0 },
      { name: 'Times Square', city: 'New York', category: 'Photography', description: 'Brightly illuminated hub of the Broadway theater district.', latitude: 40.7580, longitude: -73.9855, average_duration: 60, estimated_cost: 0 },
      { name: 'Statue of Liberty', city: 'New York', category: 'History', description: 'Iconic colossal neoclassical sculpture on Liberty Island.', latitude: 40.6892, longitude: -74.0445, average_duration: 180, estimated_cost: 2000 },
      { name: 'Empire State Building', city: 'New York', category: 'Adventure', description: 'Art Deco skyscraper with observations decks on top floors.', latitude: 40.7484, longitude: -73.9857, average_duration: 90, estimated_cost: 3500 },
      { name: 'The Museum of Modern Art (MoMA)', city: 'New York', category: 'History', description: 'Renowned art museum housing influential modern masterpieces.', latitude: 40.7614, longitude: -73.9776, average_duration: 120, estimated_cost: 2200 },
      { name: 'Brooklyn Bridge Walkway', city: 'New York', category: 'Trekking', description: 'Scenic pedestrian walkway over the historic suspension bridge.', latitude: 40.7061, longitude: -73.9969, average_duration: 60, estimated_cost: 0 },
      { name: 'Chelsea Market', city: 'New York', category: 'Food', description: 'Indoor food hall and shopping center with diverse eateries.', latitude: 40.7420, longitude: -74.0062, average_duration: 90, estimated_cost: 1500 },
      { name: 'Broadway Show', city: 'New York', category: 'Nightlife', description: 'World-class theatrical performances in Manhattan theater district.', latitude: 40.7590, longitude: -73.9845, average_duration: 180, estimated_cost: 8000 },
      { name: 'Fifth Avenue Shopping', city: 'New York', category: 'Shopping', description: 'Upscale shopping street featuring designer flagship stores.', latitude: 40.7592, longitude: -73.9768, average_duration: 120, estimated_cost: 0 },
      { name: 'Nintendo New York', city: 'New York', category: 'Anime', description: 'Flagship store containing gaming memorabilia and products.', latitude: 40.7589, longitude: -73.9793, average_duration: 60, estimated_cost: 0 },

      // PARIS (10 attractions)
      { name: 'Eiffel Tower', city: 'Paris', category: 'Photography', description: 'Wrought-iron lattice tower on the Champ de Mars.', latitude: 48.8584, longitude: 2.2945, average_duration: 120, estimated_cost: 2500 },
      { name: 'Louvre Museum', city: 'Paris', category: 'History', description: 'The worlds largest art museum, home to the Mona Lisa.', latitude: 48.8606, longitude: 2.3376, average_duration: 180, estimated_cost: 1800 },
      { name: 'Montmartre & Sacré-Cœur', city: 'Paris', category: 'Trekking', description: 'Artistic hilltop district topped by the white-domed basilica.', latitude: 48.8867, longitude: 2.3431, average_duration: 120, estimated_cost: 0 },
      { name: 'Seine River Cruise', city: 'Paris', category: 'Adventure', description: 'Scenic boat cruise showcasing Paris landmarks along the river.', latitude: 48.8600, longitude: 2.3270, average_duration: 60, estimated_cost: 1500 },
      { name: 'Champs-Élysées & Arc de Triomphe', city: 'Paris', category: 'Shopping', description: 'Famous grand avenue ending at the historic triumphal arch.', latitude: 48.8738, longitude: 2.2950, average_duration: 90, estimated_cost: 1000 },
      { name: 'Jardin du Luxembourg', city: 'Paris', category: 'Nature', description: 'Beautiful tranquil gardens built for Queen Marie de Medici.', latitude: 48.8462, longitude: 2.3371, average_duration: 90, estimated_cost: 0 },
      { name: 'Moulin Rouge Show', city: 'Paris', category: 'Nightlife', description: 'Historic cabaret offering spectacular dinner shows.', latitude: 48.8841, longitude: 2.3322, average_duration: 150, estimated_cost: 9000 },
      { name: 'Le Marais Street Food', city: 'Paris', category: 'Food', description: 'Historic neighborhood famous for its falafel and pastry shops.', latitude: 48.8575, longitude: 2.3599, average_duration: 90, estimated_cost: 1200 },
      { name: 'Shakespeare and Company', city: 'Paris', category: 'Shopping', description: 'Iconic independent English-language bookstore near Notre-Dame.', latitude: 48.8525, longitude: 2.3471, average_duration: 60, estimated_cost: 0 },
      { name: 'Manga Café Paris', city: 'Paris', category: 'Anime', description: 'A cozy library café dedicated to manga readers and video games.', latitude: 48.8471, longitude: 2.3482, average_duration: 60, estimated_cost: 500 },

      // GOA (10 attractions)
      { name: 'Baga Beach water sports', city: 'Goa', category: 'Adventure', description: 'Bustling beach offering parasailing, jet skiing, and banana rides.', latitude: 15.5553, longitude: 73.7517, average_duration: 180, estimated_cost: 2500 },
      { name: 'Basilica of Bom Jesus', city: 'Goa', category: 'History', description: 'UNESCO world heritage site holding the remains of St. Francis Xavier.', latitude: 15.5009, longitude: 73.9116, average_duration: 60, estimated_cost: 0 },
      { name: 'Dudhsagar Waterfalls trek', city: 'Goa', category: 'Trekking', description: 'Four-tiered waterfall appearing white like milk, surrounded by forest.', latitude: 15.3125, longitude: 74.3139, average_duration: 300, estimated_cost: 1000 },
      { name: 'Anjuna Flea Market', city: 'Goa', category: 'Shopping', description: 'Vibrant beachside Wednesday market with local handicrafts and clothes.', latitude: 15.5798, longitude: 73.7431, average_duration: 120, estimated_cost: 0 },
      { name: 'Tito\'s Lane', city: 'Goa', category: 'Nightlife', description: 'Famous party street lined with energetic nightclubs and bars.', latitude: 15.5540, longitude: 73.7535, average_duration: 180, estimated_cost: 1500 },
      { name: 'Fontainhas Latin Quarter', city: 'Goa', category: 'Photography', description: 'Charming historic area filled with colorful Portuguese-style houses.', latitude: 15.4989, longitude: 73.8122, average_duration: 90, estimated_cost: 0 },
      { name: 'Spice Plantation Tour', city: 'Goa', category: 'Nature', description: 'Guided walk through spice gardens followed by traditional buffet.', latitude: 15.4344, longitude: 74.0205, average_duration: 180, estimated_cost: 800 },
      { name: 'Goan Fish Curry Dining', city: 'Goa', category: 'Food', description: 'Tasting authentic Goan curry and sea food at beachside shacks.', latitude: 15.5410, longitude: 73.7510, average_duration: 90, estimated_cost: 600 },
      { name: 'Aguada Fort', city: 'Goa', category: 'History', description: '17th-century Portuguese lighthouse and fort overlooking the sea.', latitude: 15.4925, longitude: 73.7737, average_duration: 90, estimated_cost: 50 },
      { name: 'Comic Con Goa Store', city: 'Goa', category: 'Anime', description: 'Specialty hobby shop carrying pop-culture collectibles and comics.', latitude: 15.4901, longitude: 73.8211, average_duration: 60, estimated_cost: 0 }
    ];

    const sampleHotels = [
      // TOKYO (5 hotels)
      { city: 'Tokyo', name: 'Hotel Metropolitan Tokyo Ikebukuro', rating: 4.5, price_per_night: 8500, amenities: '["WiFi", "Breakfast", "Gym", "Pool"]', booking_url: 'https://www.booking.com/hotel/jp/metropolitan.html' },
      { city: 'Tokyo', name: 'Shinjuku Granbell Hotel', rating: 4.2, price_per_night: 6500, amenities: '["WiFi", "Bar", "Terrace"]', booking_url: 'https://www.booking.com/hotel/jp/shinjuku-granbell.html' },
      { city: 'Tokyo', name: 'Park Hyatt Tokyo', rating: 4.8, price_per_night: 22000, amenities: '["WiFi", "Luxury Spa", "Indoor Pool", "Fine Dining"]', booking_url: 'https://www.booking.com/hotel/jp/park-hyatt-tokyo.html' },
      { city: 'Tokyo', name: 'APA Hotel Shinjuku Kabukicho Tower', rating: 4.0, price_per_night: 4500, amenities: '["WiFi", "Onsen", "Restaurant"]', booking_url: 'https://www.booking.com/hotel/jp/apa-shinjuku-kabukicho-tower.html' },
      { city: 'Tokyo', name: 'Capsule Hotel Anshin Oyado Shinjuku', rating: 4.4, price_per_night: 2800, amenities: '["WiFi", "Sauna", "Free Drinks"]', booking_url: 'https://www.booking.com/hotel/jp/capsule-anshin-oyado.html' },

      // KYOTO (5 hotels)
      { city: 'Kyoto', name: 'The Thousand Kyoto', rating: 4.7, price_per_night: 11000, amenities: '["WiFi", "Garden", "Spa", "Fitness Center"]', booking_url: 'https://www.booking.com/hotel/jp/the-thousand-kyoto.html' },
      { city: 'Kyoto', name: 'Kyoto Granbell Hotel', rating: 4.5, price_per_night: 7000, amenities: '["WiFi", "Onsen", "Bar"]', booking_url: 'https://www.booking.com/hotel/jp/kyoto-granbell.html' },
      { city: 'Kyoto', name: 'Sotetsu Fresa Inn Kyoto-Hachijoguchi', rating: 4.1, price_per_night: 4200, amenities: '["WiFi", "Laundry", "Lobby Café"]', booking_url: 'https://www.booking.com/hotel/jp/sotetsu-fresa-inn-kyoto.html' },
      { city: 'Kyoto', name: 'Ryokan Gion Hanamikoji', rating: 4.6, price_per_night: 15000, amenities: '["WiFi", "Traditional Futon", "Private Bath", "Kaiseki Meal"]', booking_url: 'https://www.booking.com/hotel/jp/ryokan-gion-hanamikoji.html' },
      { city: 'Kyoto', name: 'Piece Hostel Sanjo', rating: 4.3, price_per_night: 2200, amenities: '["WiFi", "Shared Kitchen", "Bicycle Rental"]', booking_url: 'https://www.booking.com/hotel/jp/piece-hostel-sanjo.html' },

      // NEW YORK (5 hotels)
      { city: 'New York', name: 'The Plaza Hotel', rating: 4.8, price_per_night: 35000, amenities: '["WiFi", "Butler Service", "Luxury Spa", "Champagne Bar"]', booking_url: 'https://www.booking.com/hotel/us/the-plaza.html' },
      { city: 'New York', name: 'Arlo NoMad', rating: 4.3, price_per_night: 12000, amenities: '["WiFi", "Rooftop Bar", "Bicycles"]', booking_url: 'https://www.booking.com/hotel/us/arlo-nomad.html' },
      { city: 'New York', name: 'Pod 39 Hotel', rating: 4.0, price_per_night: 7500, amenities: '["WiFi", "Rooftop Lounge", "Game Room"]', booking_url: 'https://www.booking.com/hotel/us/pod-39.html' },
      { city: 'New York', name: 'Freehand New York', rating: 4.2, price_per_night: 9500, amenities: '["WiFi", "Fitness Center", "Multiple Bars"]', booking_url: 'https://www.booking.com/hotel/us/freehand-new-york.html' },
      { city: 'New York', name: 'Row NYC', rating: 3.8, price_per_night: 5800, amenities: '["WiFi", "Fitness Center", "Food Court"]', booking_url: 'https://www.booking.com/hotel/us/row-nyc.html' },

      // PARIS (5 hotels)
      { city: 'Paris', name: 'Ritz Paris', rating: 4.9, price_per_night: 42000, amenities: '["WiFi", "Michelin Dining", "Luxury Pool", "Spa"]', booking_url: 'https://www.booking.com/hotel/fr/ritz-paris.html' },
      { city: 'Paris', name: 'Hotel Regina Louvre', rating: 4.6, price_per_night: 18000, amenities: '["WiFi", "Eiffel Tower View", "Bar", "Pet Friendly"]', booking_url: 'https://www.booking.com/hotel/fr/regina-louvre.html' },
      { city: 'Paris', name: 'CitizenM Paris Gare de Lyon', rating: 4.4, price_per_night: 9000, amenities: '["WiFi", "iPad Controls", "24/7 Food & Drinks"]', booking_url: 'https://www.booking.com/hotel/fr/citizenm-paris-gare-de-lyon.html' },
      { city: 'Paris', name: 'Generator Paris Hostel', rating: 4.0, price_per_night: 3200, amenities: '["WiFi", "Rooftop Bar", "Laundry"]', booking_url: 'https://www.booking.com/hotel/fr/generator-paris.html' },
      { city: 'Paris', name: 'Hotel de Neuve by Happyculture', rating: 4.1, price_per_night: 6800, amenities: '["WiFi", "Concierge", "Nespresso Machine"]', booking_url: 'https://www.booking.com/hotel/fr/hotel-de-neuve.html' },

      // GOA (5 hotels)
      { city: 'Goa', name: 'Taj Exotica Resort & Spa Goa', rating: 4.8, price_per_night: 14000, amenities: '["WiFi", "Beach Front", "Golf Course", "Spa"]', booking_url: 'https://www.booking.com/hotel/in/taj-exotica-goa.html' },
      { city: 'Goa', name: 'Novotel Goa Resort & Spa', rating: 4.3, price_per_night: 6500, amenities: '["WiFi", "Kids Club", "Pool Bar", "Gym"]', booking_url: 'https://www.booking.com/hotel/in/novotel-goa-resort-spa.html' },
      { city: 'Goa', name: 'Fairfield by Marriott Goa Anjuna', rating: 4.2, price_per_night: 4500, amenities: '["WiFi", "Outdoor Pool", "Fitness Center"]', booking_url: 'https://www.booking.com/hotel/in/fairfield-by-marriott-goa.html' },
      { city: 'Goa', name: 'Red Door Hostel Anjuna', rating: 4.0, price_per_night: 1200, amenities: '["WiFi", "Garden", "Barbecue", "Shared Lounge"]', booking_url: 'https://www.booking.com/hotel/in/red-door-hostel.html' },
      { city: 'Goa', name: 'Ibiza Guesthouse Arambol', rating: 4.1, price_per_night: 1800, amenities: '["WiFi", "Kitchenette", "Rooftop Yoga"]', booking_url: 'https://www.booking.com/hotel/in/ibiza-guesthouse.html' }
    ];

    db.serialize(() => {
      const stmtAttr = db.prepare('INSERT INTO attractions (name, city, category, description, latitude, longitude, average_duration, estimated_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      sampleAttractions.forEach((attr) => {
        stmtAttr.run(attr.name, attr.city, attr.category, attr.description, attr.latitude, attr.longitude, attr.average_duration, attr.estimated_cost);
      });
      stmtAttr.finalize();

      const stmtHotel = db.prepare('INSERT INTO hotels (city, name, rating, price_per_night, amenities, booking_url) VALUES (?, ?, ?, ?, ?, ?)');
      sampleHotels.forEach((h) => {
        stmtHotel.run(h.city, h.name, h.rating, h.price_per_night, h.amenities, h.booking_url);
      });
      stmtHotel.finalize();

      console.log('Seeding complete. Default attractions and hotels successfully added.');
    });
  });
}

module.exports = db;
