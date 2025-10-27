import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import { createMinute, getMinute, updateMinute, send2Sign} from '../controllers/minutesController.js';
const router = express.Router();

router.use(verifyAccessToken);
router.post('/create-minute',createMinute);
router.get('/minute/:meetingId', getMinute)
router.put('/minute/:meetingId/update', updateMinute)
router.post('/minute/:meetingId/sign', send2Sign)
export default router;