import express from 'express';
import {handleStreamRequest} from '../chatbot/chatbot.js'
const router = express.Router();
router.post('/' ,handleStreamRequest);

export default router;