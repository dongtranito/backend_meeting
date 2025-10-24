import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import { createTranscript, createMinute, getMinute, updateMinute} from '../controllers/minutesController.js';
const router = express.Router();

router.use(verifyAccessToken);
router.post('/create-transcript',createTranscript);  
router.post('/create-minute',createMinute);
router.get('/minute/:meetingId', getMinute)
router.put('/minute/:meetingId/update', updateMinute)


export default router;