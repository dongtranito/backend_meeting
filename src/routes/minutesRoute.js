import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import { createTranscript, createMinute } from '../controllers/minutesController.js';
const router = express.Router();

router.use(verifyAccessToken);
router.post('/create-transcript',createTranscript);  
router.post('/create-minute',createMinute);  

export default router;