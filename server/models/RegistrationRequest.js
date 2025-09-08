// models/RegistrationRequest.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const registrationRequestSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'investigator', 'coder'], required: true },
}, { timestamps: true });

registrationRequestSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.model('RegistrationRequest', registrationRequestSchema);
