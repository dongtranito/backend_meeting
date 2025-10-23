import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import { createTranscript } from '../controllers/minutesController.js';
const router = express.Router();

router.use(verifyAccessToken);
router.post('/create-transcript',createTranscript);  
export default router;