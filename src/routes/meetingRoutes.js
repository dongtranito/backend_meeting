import express from 'express';
import { handleTranscriptUpload, getMeetingDetail, getMeetingList, deleteMeeting } from '../controllers/meetingController.js';

import { verifyAccessToken } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.use(verifyAccessToken);
router.post('/submitTranscript' ,handleTranscriptUpload);
router.get('/getMeetingDetail/:meetingId' ,getMeetingDetail);
router.get('/getMeetingList' ,getMeetingList);
router.delete('/deleteMeeting/:meetingId' ,deleteMeeting);




export default router;