// controllers/auth.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// controllers/auth.js
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
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // שולח token ב-httpOnly cookie במקום ב-localStorage
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // חובה ל-HTTPS בפרודקשן
      sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax", // Lax בפיתוח
      maxAge: 60 * 60 * 1000, // שעה
    });

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

// controllers/auth.js
exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
  });
  res.json({ message: "Logged out successfully" });
};

// בדיקת אותנטיקציה נוכחית
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
