import jwt from 'jsonwebtoken';

const ACCESS_SECRET = "ACCESS_SECRET_KEY";
const REFRESH_SECRET = "REFRESH_SECRET_KEY";

const createAccessToken = (email) => {
  return jwt.sign({ email }, ACCESS_SECRET, { expiresIn: "120m" });
};

const createRefreshToken = (email) => {
  return jwt.sign({ email }, REFRESH_SECRET, { expiresIn: "7d" });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

export default {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
