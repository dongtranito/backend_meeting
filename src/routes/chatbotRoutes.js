import express from 'express';
import {handleStreamRequest} from '../chatbot/chatbot.js'
import { verifyAccessToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyAccessToken);
router.post('/' ,handleStreamRequest);

export default router;