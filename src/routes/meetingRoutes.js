const express = require('express');
const router = express.Router();
const { handleTranscriptUpload, getMeetingDetail,getMeetingList } = require('../controllers/meetingController');
const {verifyAccessToken} =require ("../middlewares/authMiddleware");


router.use(verifyAccessToken);
router.post('/submitTranscript' ,handleTranscriptUpload);
router.get('/getMeetingDetail/:meetingId' ,getMeetingDetail);
router.get('/getMeetingList' ,getMeetingList);




module.exports = router;