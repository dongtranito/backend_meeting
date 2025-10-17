import jwtService from '../services/jwtService.js';

const verifyAccessToken = (req, res, next) => {
const token = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    const decoded = jwtService.verifyAccessToken(token);
    req.email = decoded.email;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};

const verifyRefreshToken = (req, res, next) => {
  const token = req.cookies.refreshToken || req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "Không có refresh token" });
  }

  try {
    const decoded = jwtService.verifyRefreshToken(token);
    req.email = decoded.email;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};

export { verifyAccessToken, verifyRefreshToken };
