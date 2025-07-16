const express = require('express');
const router = express.Router();
const {getToken, saveTextResult} = require('../controllers/azureControllers');
const {verifyAccessToken} =require ("../middlewares/authMiddleware");


router.use(verifyAccessToken);
router.get('/token', getToken);
router.post('/receiveSpeech', saveTextResult);
// router.get('/receiveSpeech', tokenController.getToken);


module.exports = router;
