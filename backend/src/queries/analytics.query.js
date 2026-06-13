const Session = require('../models/Session');
const mongoose = require('mongoose');

/**
 * Get overview analytics for a user
 */
const getOverview = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [overview] = await Session.aggregate([
    { $match: { userId: uid, completed: true } },
    {
      $group: {
        _id: null,
        sessionsCompleted: { $sum: 1 },
        averageStress: { $avg: '$context.stress' },
        averageSleep: { $avg: '$context.sleepHours' },
        averageStudy: { $avg: '$context.studyHours' },
      },
    },
    {
      $project: {
        _id: 0,
        sessionsCompleted: 1,
        averageStress: { $round: ['$averageStress', 1] },
        averageSleep: { $round: ['$averageSleep', 1] },
        averageStudy: { $round: ['$averageStudy', 1] },
      },
    },
  ]);

  return overview || { sessionsCompleted: 0, averageStress: 0, averageSleep: 0, averageStudy: 0 };
};

/**
 * Get mood trend over last N sessions
 */
const getMoodTrend = async (userId, limit = 14) => {
  const uid = new mongoose.Types.ObjectId(userId);

  return Session.aggregate([
    { $match: { userId: uid, completed: true } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    { $sort: { createdAt: 1 } },
    {
      $project: {
        _id: 0,
        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        mood: '$context.mood',
        stress: '$context.stress',
      },
    },
  ]);
};

/**
 * Get stress trend (daily average)
 */
const getStressTrend = async (userId, days = 30) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return Session.aggregate([
    { $match: { userId: uid, completed: true, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        avgStress: { $avg: '$context.stress' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        avgStress: { $round: ['$avgStress', 1] },
        count: 1,
      },
    },
  ]);
};

/**
 * Get trigger frequency from reports
 */
const getTriggerFrequency = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  return Session.aggregate([
    { $match: { userId: uid, completed: true, 'report.trigger': { $exists: true, $ne: null } } },
    {
      $group: {
        _id: { $toLower: '$report.trigger' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, trigger: '$_id', count: 1 } },
  ]);
};

/**
 * Get mood distribution
 */
const getMoodDistribution = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  return Session.aggregate([
    { $match: { userId: uid, completed: true } },
    { $group: { _id: '$context.mood', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, mood: '$_id', count: 1 } },
  ]);
};

/**
 * Get emotional heatmap data (day of week × hour)
 */
const getEmotionalHeatmap = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  return Session.aggregate([
    { $match: { userId: uid, completed: true } },
    {
      $group: {
        _id: {
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          hour: { $hour: '$createdAt' },
        },
        avgStress: { $avg: '$context.stress' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        dayOfWeek: '$_id.dayOfWeek',
        hour: '$_id.hour',
        avgStress: { $round: ['$avgStress', 1] },
        count: 1,
      },
    },
  ]);
};

/**
 * Get weekly report
 */
const getWeeklyReport = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const sessions = await Session.find({
    userId: uid,
    completed: true,
    createdAt: { $gte: weekAgo },
  }).select('context report createdAt');

  if (!sessions.length) return null;

  const avgStress = sessions.reduce((s, x) => s + x.context.stress, 0) / sessions.length;
  const avgSleep = sessions.reduce((s, x) => s + x.context.sleepHours, 0) / sessions.length;
  const triggers = sessions
    .map((s) => s.report?.trigger)
    .filter(Boolean)
    .reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

  const commonTrigger = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Recovery score: inverse of stress, bonus for low stress days
  const recoveryScore = Math.max(0, Math.min(100, Math.round((10 - avgStress) * 10)));

  return {
    period: 'last_7_days',
    sessionsCompleted: sessions.length,
    averageStress: Math.round(avgStress * 10) / 10,
    averageSleep: Math.round(avgSleep * 10) / 10,
    commonTrigger,
    recoveryScore,
    insights: generateInsights(avgStress, avgSleep, sessions.length),
  };
};

const generateInsights = (avgStress, avgSleep, sessionCount) => {
  const insights = [];
  if (avgStress > 7) insights.push('Your stress levels have been high this week. Consider scheduling regular breaks.');
  if (avgStress <= 4) insights.push('Great job keeping stress manageable this week!');
  if (avgSleep < 6) insights.push('You\'ve been sleeping less than 6 hours. Prioritise rest for better mental clarity.');
  if (avgSleep >= 7) insights.push('Your sleep schedule looks healthy this week.');
  if (sessionCount >= 5) insights.push('You\'ve been consistent with check-ins. Keep it up!');
  if (sessionCount < 2) insights.push('Try to check in more frequently to track your wellness journey.');
  return insights;
};

module.exports = {
  getOverview,
  getMoodTrend,
  getStressTrend,
  getTriggerFrequency,
  getMoodDistribution,
  getEmotionalHeatmap,
  getWeeklyReport,
};
