const router = require('express').Router();
const projectController = require('../controllers/projectController');
const validateToken = require('../middleware/validateToken');

router.get('/', validateToken, projectController.listProjects);
router.post('/', validateToken, projectController.createProject);
router.get('/:projectId', validateToken, projectController.getProject);
router.patch('/:projectId', validateToken, projectController.updateProject);
router.patch('/:projectId/archive', validateToken, projectController.archiveProject);
router.patch('/:projectId/close', validateToken, projectController.closeProject);
router.get('/:projectId/members', validateToken, projectController.listProjectMembers);
router.post('/:projectId/members', validateToken, projectController.addProjectMember);
router.delete('/:projectId/members/:userId', validateToken, projectController.removeProjectMember);

module.exports = router;