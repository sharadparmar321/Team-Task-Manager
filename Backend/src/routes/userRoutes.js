const router = require('express').Router();
const userController = require('../controllers/userController');
const validateToken = require('../middleware/validateToken');
const requireRole = require('../middleware/requireRole');
const { USER_ROLES } = require('../constants');

router.get('/', validateToken, requireRole(USER_ROLES.ADMIN), userController.listUsers);
router.get('/me', validateToken, userController.profile);
router.patch('/:userId/promote', validateToken, requireRole(USER_ROLES.ADMIN), userController.promoteToAdmin);

module.exports = router;