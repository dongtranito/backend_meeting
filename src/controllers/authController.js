const { admin, db } = require("../services/firebaseService");
const jwtService = require("../services/jwtService");

const login = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        
        return res.status(400).json({ message: "Thiếu idToken từ client" });
        
    }

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        // console.log(decoded);
        const email = decoded.email;
        const usersRef = db.collection("users");
        const userSnap = await usersRef.where("email", "==", email).get();

        if (userSnap.empty) {
            await usersRef.add({
                email: email,
                name: decoded.name || "",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                picture: decoded.picture
            });
            // console.log(" Tạo user mới trong Firestore:", email);
        } else {
            // console.log("Đã tồn tại user với email:", email);
        }

        const accessToken = jwtService.createAccessToken(email);
        const refreshToken = jwtService.createRefreshToken(email);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
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
            maxAge: 15 * 60 * 1000,
        });

        res.json({ message: "Refresh thành công" });
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

module.exports = {
    login,
    refreshToken,
    logout,
    getProfile,
};
