import { admin, db } from '../config/firebaseService.js';
import jwtService from '../services/jwtService.js';

import dotenv from "dotenv";
dotenv.config();

const login = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ message: "Thiếu idToken từ client" });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        // console.log(decoded);
        const email = decoded.email;
        const userRef = db.collection("users").doc(email);
        const doc = await userRef.get();

        if (!doc.exists) {
            await userRef.set({
                email,
                name: decoded.name || "",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                picture: decoded.picture
            });
        }

        const accessToken = jwtService.createAccessToken(email);
        const refreshToken = jwtService.createRefreshToken(email);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
            sameSite: "none",
            secure: true,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true,
        });
        res.json({
            message: "Xác minh thành công",
            email: decoded.email,
        });

    } catch (err) {
        res.status(401).json({ message: "idToken không hợp lệ", error: err.message });
    }
};

const refreshToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Không có refresh token" });
    }

    try {
        const decoded = jwtService.verifyRefreshToken(refreshToken);
        const newAccessToken = jwtService.createAccessToken(decoded.email);

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
            sameSite: "none",
            secure: true,
        });

        res.json({ message: "Refresh thành công", accessKey: newAccessToken });
    } catch (err) {
        res.status(403).json({ message: "Refresh token không hợp lệ" });
    }
};

const logout = (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Đăng xuất thành công" });
};

const getProfile = (req, res) => {
    res.json({ message: "Thông tin người dùng từ token", email: req.email, });
};

export {
    login,
    refreshToken,
    logout,
    getProfile,
};
