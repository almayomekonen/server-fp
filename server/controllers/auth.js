const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const RegistrationRequest = require("../models/RegistrationRequest");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 🔹 1️⃣ בדיקה קודם כל אם יש pending registration request (Case Insensitive)
    const pendingRequest = await RegistrationRequest.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, "i") } },
        { email: { $regex: new RegExp(`^${username}$`, "i") } },
      ],
    });

    if (pendingRequest) {
      const isMatch = await bcrypt.compare(
        password,
        pendingRequest.passwordHash
      );

      if (isMatch) {
        console.log(`Login: Pending request password match for '${username}'`);
        return res.status(403).json({
          message:
            "Your account is pending approval. Please wait for admin approval.",
        });
      } else {
        console.log(
          `Login: Pending request password mismatch for '${username}'`
        );
        return res.status(401).json({
          message: "Invalid password (registration pending)",
        });
      }
    }

    // 🔹 2️⃣ אם אין pending request – בדוק את main User collection
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, "i") } },
        { email: { $regex: new RegExp(`^${username}$`, "i") } },
      ],
    });

    if (!user) {
      console.log(`Login: User '${username}' not found in main collection`);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      console.log(`Login: Invalid password for user '${username}'`);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // ✅ Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("token", token, cookieOptions);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error", err });
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
