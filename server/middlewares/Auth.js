// middlewares/auth.js
const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  const token = req.cookies.token;

  console.log("🔐 Auth middleware - checking token");
  console.log("🍪 All cookies:", req.cookies);
  console.log("🎫 Token:", token ? "exists" : "missing");

  if (!token) {
    console.log("❌ No token - returning 401");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("✅ Token valid for user:", req.user.id);
    next();
  } catch (err) {
    console.log("❌ Token invalid:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

exports.authorizeAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
};
