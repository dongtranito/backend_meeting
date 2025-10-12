import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import {getListMeeting,createMeeting, deleteMeeting, updateMeeting} from '../controllers/mettingController1.js'
const router = express.Router();


router.use(verifyAccessToken);
router.get('/get-list-meeting', getListMeeting);  // ?groupId=,
router.post('/create-meeting', createMeeting);
router.delete('/delete-meeting/:meetingId', deleteMeeting);
router.put('/update-meeting/:meetingId', updateMeeting);

export default router;