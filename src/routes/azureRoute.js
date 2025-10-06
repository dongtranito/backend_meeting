import express from 'express';
import { getToken, saveTextResult } from '../controllers/azureControllers.js';

import { verifyAccessToken } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.use(verifyAccessToken);
router.get('/token', getToken);
router.post('/receiveSpeech', saveTextResult);
// router.get('/receiveSpeech', tokenController.getToken);


export default router;
