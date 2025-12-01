// routes/emailVerification.js
const express = require("express");
const router = express.Router();
const emailVerificationController = require("../controllers/emailVerification");

// Send verification code to email
router.post("/send-code", emailVerificationController.sendVerificationCode);

// Verify code that user received
router.post("/verify-code", emailVerificationController.verifyCode);

module.exports = router;
