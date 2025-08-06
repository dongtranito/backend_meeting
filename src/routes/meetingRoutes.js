const express = require('express');
const router = express.Router();
const { handleTranscriptUpload, getMeetingDetail,getMeetingList,deleteMeeting } = require('../controllers/meetingController');
const {verifyAccessToken} =require ("../middlewares/authMiddleware");


router.use(verifyAccessToken);
router.post('/submitTranscript' ,handleTranscriptUpload);
router.get('/getMeetingDetail/:meetingId' ,getMeetingDetail);
router.get('/getMeetingList' ,getMeetingList);
router.delete('/deleteMeeting/:meetingId' ,deleteMeeting);




module.exports = router;