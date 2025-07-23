const express = require('express');
const router = express.Router();
const { handleTranscriptUpload } = require('../controllers/meetingController');
const {verifyAccessToken} =require ("../middlewares/authMiddleware");


router.use(verifyAccessToken);
router.post('/submitTranscript' ,handleTranscriptUpload);



module.exports = router;