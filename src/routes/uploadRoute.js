import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import multer   from 'multer';
import {uploadMetadata, uploadRecord} from '../controllers/uploadController.js'
const router = express.Router();
const upload = multer({ dest: "uploads/" });


router.use(verifyAccessToken);
// router.post('/upload-sample-voice' ,upload.single("file") ,createSampleVoice);
router.post('/metadata' ,upload.single("file") ,uploadMetadata);
router.post('/record', upload.single("file"),uploadRecord);
export default router;