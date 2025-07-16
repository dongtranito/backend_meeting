const express = require('express');
const router = express.Router();
const { login,logout,refreshToken,getProfile } =require( '../controllers/authController');
const {verifyAccessToken, verifyRefreshToken} =require ("../middlewares/authMiddleware");
console.log("🧪 getProfile =", getProfile); 

router.post("/login", login);
router.post("/refresh-token", verifyRefreshToken, refreshToken);
router.post("/logout", verifyAccessToken,logout);
router.get("/profile", verifyAccessToken, getProfile);

module.exports = router;