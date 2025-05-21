const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const userAuthMiddleware = require('../middleware/auth.middleware');

const { createProjectController, getAllProjectsController, addUserToProjectController, getProjectByIdControllers , updateFileTreeControllers} = require('../controllers/project.Controllers');


router.post('/create',
    body('name').isString().withMessage('Name is requires'),
    userAuthMiddleware, createProjectController);



router.get('/all', userAuthMiddleware, getAllProjectsController);


router.put('/add-user', body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'), userAuthMiddleware, addUserToProjectController);

router.get('/get-project/:projectId', userAuthMiddleware, getProjectByIdControllers);

router.put('/update-file-tree',
    userAuthMiddleware,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    updateFileTreeControllers,
  
)

module.exports = router;

