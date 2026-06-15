const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const healthRoutes = require('./routes/health');
const tripRoutes = require('./routes/trips');

// Import db to trigger database initialization and seeding
const db = require('./database/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Register routes
app.use('/api/health', healthRoutes);
app.use('/api/trips', tripRoutes);

// Root path fallback
app.get('/', (req, res) => {
  res.send('AI Travel Planner API Server is running.');
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${config.node_env} mode on port ${PORT}`);
});
