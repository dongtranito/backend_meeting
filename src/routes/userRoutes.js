import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import { createSampleVoice,getSampleVoice } from '../controllers/userController.js';
import multer   from 'multer';
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(verifyAccessToken);
router.post('/create-sample-voice',upload.single("file"),createSampleVoice);  //chỗ này trường hợp đặt biệt nó không cần tách ra thành 2 api
router.get ('/getSampleVoice', getSampleVoice);
export default router;