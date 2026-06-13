const { Router } = require('express');
const {
  startSession,
  sendMessage,
  endSession,
  getSession,
  uploadAudio,
} = require('../controllers/session.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { sessionRateLimiter } = require('../middlewares/rateLimiter.middleware');

const router = Router();

// All session routes require authentication
router.use(authenticate);

router.post('/start', sessionRateLimiter, startSession);
router.post('/message', uploadAudio, sendMessage);
router.post('/end', endSession);
router.get('/:id', getSession);

module.exports = router;
