const { Router } = require('express');
const { getOverview, getTrends, getReport } = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/overview', getOverview);
router.get('/trends', getTrends);
router.get('/report', getReport);

module.exports = router;
