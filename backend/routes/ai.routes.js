const express = require('express');

const router = express.Router();

const aiController = require('../controllers/ai.Controllers');

router.get('/get-result' , aiController);



module.exports = router;