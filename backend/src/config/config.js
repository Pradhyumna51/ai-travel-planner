const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  gemini_api_key: process.env.GEMINI_API_KEY,
  node_env: process.env.NODE_ENV || 'development',
  database_path: path.join(__dirname, '../../travel_planner.db')
};
