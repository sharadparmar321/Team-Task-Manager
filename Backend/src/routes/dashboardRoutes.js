const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const validateToken = require('../middleware/validateToken');

router.get('/summary', validateToken, dashboardController.getSummary);

module.exports = router;