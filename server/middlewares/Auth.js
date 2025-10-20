// middlewares/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.authenticate = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // ✅ Check if user's role in DB matches JWT role
    const userInDb = await User.findById(decoded.id);

    if (!userInDb) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Check token version - this is more precise than role check
    // Only users whose roles were actually changed will be logged out
    const dbVersion = userInDb.tokenVersion || 0;
    const jwtVersion = decoded.tokenVersion || 0;
    const hasTokenVersion = decoded.hasOwnProperty("tokenVersion");

    console.log(`🔍 Token Check: User ${decoded.id} | Role: ${decoded.role}`);
    console.log(`   JWT has tokenVersion: ${hasTokenVersion}`);
    console.log(`   JWT version: ${jwtVersion} | DB version: ${dbVersion}`);

    // Only check version if BOTH have tokenVersion (ignore old JWTs)
    if (hasTokenVersion && dbVersion !== jwtVersion) {
      console.log(`🔄 Token version mismatch - logging out user!`);

      return res.status(401).json({
        message: "Role changed",
        code: "ROLE_CHANGED",
        newRole: userInDb.role,
      });
    }

    console.log(`✅ Token accepted`);
    req.user = decoded;
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
