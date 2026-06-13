require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { getRedisClient } = require('./config/redis');
const env = require('./config/env');
const logger = require('./config/logger');

const PORT = parseInt(env.PORT, 10) || 5000;

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis (eager connection check)
    const redis = getRedisClient();
    await redis.connect().catch(() => {}); // Already connected if using lazyConnect=false

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 MindMate API running on port ${PORT} [${env.NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

start();
