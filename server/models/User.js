// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "investigator", "coder"],
      required: true,
    },
    tokenVersion: { type: Number, default: 0 }, // ✅ Track token invalidation
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.validatePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
