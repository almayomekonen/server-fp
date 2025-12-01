// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { authenticate } = require("../middlewares/Auth");
const rateLimit = require("express-rate-limit");

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: "Too many login attempts. Try again later.",
});

router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

module.exports = router;
