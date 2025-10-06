import express from 'express';
import { login, logout, refreshToken, getProfile } from '../controllers/authController.js';

import { verifyAccessToken, verifyRefreshToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/login", login);
router.post("/refresh-token", verifyRefreshToken, refreshToken);
router.post("/logout", verifyAccessToken,logout);
router.get("/profile", verifyAccessToken, getProfile);

export default router;