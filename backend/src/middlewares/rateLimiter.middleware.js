const { redisIncr } = require('../config/redis');
const { error } = require('../utils/apiResponse');
const env = require('../config/env');

const sessionRateLimiter = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `ratelimit:session:${userId}:${today}`;

    const count = await redisIncr(key, 86400); // 24h TTL

    const maxSessions = parseInt(env.MAX_SESSIONS_PER_DAY, 10);
    if (count > maxSessions) {
      return error(
        res,
        `Daily session limit reached (${maxSessions} sessions/day). Try again tomorrow.`,
        429
      );
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxSessions,
      'X-RateLimit-Remaining': Math.max(0, maxSessions - count),
    });

    next();
  } catch (err) {
    // If Redis fails, allow request through (fail open)
    next();
  }
};

module.exports = { sessionRateLimiter };
