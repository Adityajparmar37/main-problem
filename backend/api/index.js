const app = require('../src/app');
const connectDB = require('../src/config/db');

// Connect to MongoDB
// In a serverless environment, this handles re-using the connection
connectDB();

module.exports = app;
