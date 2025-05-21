const express = require('express');

const {body} = require('express-validator');

const router = express.Router();



const {createUserController , loginController , profileController , logoutController , getAllUserController } = require('../controllers/user.Controllers');
const userAuthMiddleware = require('../middleware/auth.middleware');



router.post('/register',
     body('email').isEmail().withMessage('Email must be a valid email address'),
     body('password').isLength({min:6}).withMessage("password must be at least 6 letters long")
     , createUserController);

router.post('/login' ,
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({min:6}).withMessage("password must be at least 6 letters long")
    , loginController

);

router.get('/profile' , userAuthMiddleware , profileController);

router.get('/logout' ,userAuthMiddleware, logoutController);

router.get('/all' , userAuthMiddleware , getAllUserController);

module.exports = router;     
