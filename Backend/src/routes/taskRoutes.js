const router = require('express').Router();
const taskController = require('../controllers/taskController');
const validateToken = require('../middleware/validateToken');

router.get('/', validateToken, taskController.listTasks);
router.post('/', validateToken, taskController.createTask);
router.patch('/:taskId', validateToken, taskController.updateTask);
router.patch('/:taskId/status', validateToken, taskController.updateTaskStatus);
router.delete('/:taskId', validateToken, taskController.deleteTask);

module.exports = router;