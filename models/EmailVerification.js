// models/EmailVerification.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const emailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  codeHash: { type: String, select: false },
  expiresAt: { type: Date, index: { expires: 0 }, select: false }, // TTL index
  verified: { type: Boolean, default: false }
}, { timestamps: true });


// עוזר ליצירת hash של קוד
emailVerificationSchema.statics.hashCode = function(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
};

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
