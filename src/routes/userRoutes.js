import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import multer   from 'multer';
import { handleSampleVoiceUpload,getSampleVoice } from '../controllers/userController.js';

const router = express.Router();
const upload = multer({ dest: "uploads/" });


router.use(verifyAccessToken);
router.get('/uploadSample' ,upload.single("file") ,handleSampleVoiceUpload);
router.get ('/getSampleVoice', getSampleVoice);
export default router;