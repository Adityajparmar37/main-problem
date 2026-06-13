const { redisGet, redisSet, redisDel } = require('../config/redis');
const analyticsQuery = require('../queries/analytics.query');
const env = require('../config/env');
const logger = require('../config/logger');

const ANALYTICS_TTL = parseInt(env.ANALYTICS_CACHE_TTL_SECONDS, 10);

const cacheKey = (userId, suffix = 'overview') => `analytics:user:${userId}:${suffix}`;

/**
 * Get overview with Redis cache
 */
const getOverview = async (userId) => {
  const key = cacheKey(userId, 'overview');
  const cached = await redisGet(key);
  if (cached) {
    logger.debug('Analytics overview cache hit', { userId });
    return cached;
  }

  const data = await analyticsQuery.getOverview(userId);
  await redisSet(key, data, ANALYTICS_TTL);
  return data;
};

/**
 * Get all trend data
 */
const getTrends = async (userId) => {
  const key = cacheKey(userId, 'trends');
  const cached = await redisGet(key);
  if (cached) return cached;

  const [moodTrend, stressTrend, triggerFrequency, moodDistribution] = await Promise.all([
    analyticsQuery.getMoodTrend(userId),
    analyticsQuery.getStressTrend(userId),
    analyticsQuery.getTriggerFrequency(userId),
    analyticsQuery.getMoodDistribution(userId),
  ]);

  const data = { moodTrend, stressTrend, triggerFrequency, moodDistribution };
  await redisSet(key, data, ANALYTICS_TTL);
  return data;
};

/**
 * Get full weekly report with heatmap
 */
const getReport = async (userId) => {
  const key = cacheKey(userId, 'report');
  const cached = await redisGet(key);
  if (cached) return cached;

  const [weeklyReport, heatmap] = await Promise.all([
    analyticsQuery.getWeeklyReport(userId),
    analyticsQuery.getEmotionalHeatmap(userId),
  ]);

  const data = { weeklyReport, heatmap };
  await redisSet(key, data, ANALYTICS_TTL);
  return data;
};

/**
 * Invalidate all analytics cache for a user (called after session ends)
 */
const invalidateCache = async (userId) => {
  await Promise.all([
    redisDel(cacheKey(userId, 'overview')),
    redisDel(cacheKey(userId, 'trends')),
    redisDel(cacheKey(userId, 'report')),
  ]);
  logger.debug('Analytics cache invalidated', { userId });
};

module.exports = { getOverview, getTrends, getReport, invalidateCache };
