const router = require('express').Router();
const authController = require('../controllers/authController');
const validateToken = require('../middleware/validateToken');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', validateToken, authController.me);

module.exports = router;