// controllers/auth.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });

    const validPassword = await user.validatePassword(password);
    if (!validPassword)
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        tokenVersion: user.tokenVersion || 0, // ✅ Include version for invalidation
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // 🔥 שינוי הגדרות לפי סביבה
    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // true רק בפרודקשן
      sameSite: isProduction ? "none" : "lax", // none בפרודקשן, lax בפיתוח
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    console.log("🍪 Setting cookie with options:", cookieOptions);
    console.log("🌍 Request origin:", req.headers.origin);
    console.log("🔒 Is production:", isProduction);
    console.log("🔐 Protocol:", req.protocol);
    console.log("🔗 Secure?:", req.secure);

    res.cookie("token", token, cookieOptions);

    console.log("✅ Cookie set successfully for user:", user.username);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", err });
  }
};

exports.logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.json({ message: "Logged out successfully" });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};
