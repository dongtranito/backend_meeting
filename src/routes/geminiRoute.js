const express = require('express');
const router = express.Router();
const { getBienBanController,handleTranscriptUpload } = require('../controllers/geminiControllers');
const {verifyAccessToken} =require ("../middlewares/authMiddleware");


router.use(verifyAccessToken);
router.post('/generateBienBan', getBienBanController);
router.post('/submitTranscript', handleTranscriptUpload)

module.exports = router;