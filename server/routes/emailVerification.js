// routes/emailVerification.js
const express = require('express');
const router = express.Router();
const emailVerificationController = require('../controllers/emailVerification');

// שליחת קוד אימות למייל
router.post('/send-code', emailVerificationController.sendVerificationCode);

// אימות הקוד שהמשתמש קיבל
router.post('/verify-code', emailVerificationController.verifyCode);

module.exports = router;
