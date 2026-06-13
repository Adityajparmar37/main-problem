require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./config/logger');

const authRoutes = require('./routes/auth.routes');
const sessionRoutes = require('./routes/session.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

// HTTP request logging
app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'MindMate API' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
