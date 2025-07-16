// routes/meetingRoutes.js
const express = require("express");
const { createMeeting } = require("../controllers/meetingController");
const {verifyAccessToken} =require ("../middlewares/authMiddleware");

const router = express.Router();

router.post("/createMeeting", verifyAccessToken, createMeeting);

module.exports = router;
