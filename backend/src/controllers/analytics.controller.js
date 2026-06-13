const analyticsService = require('../services/analytics.service');
const { success } = require('../utils/apiResponse');

/**
 * GET /analytics/overview
 */
const getOverview = async (req, res) => {
  const userId = req.user._id.toString();
  const data = await analyticsService.getOverview(userId);
  return success(res, data, 'Analytics overview fetched');
};

/**
 * GET /analytics/trends
 */
const getTrends = async (req, res) => {
  const userId = req.user._id.toString();
  const data = await analyticsService.getTrends(userId);
  return success(res, data, 'Trends fetched');
};

/**
 * GET /analytics/report
 */
const getReport = async (req, res) => {
  const userId = req.user._id.toString();
  const data = await analyticsService.getReport(userId);
  return success(res, data, 'Report fetched');
};

module.exports = { getOverview, getTrends, getReport };
