const mongoose = require("mongoose");

const User = require("../models/User");
const { deleteUserCascade } = require("../services/deleteCascade");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const updateFields = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If we want to update new password - handle separately
    if (updateFields.newPassword) {
      await user.setPassword(updateFields.newPassword);
      delete updateFields.newPassword;
    }

    // ✅ If role is changing, increment tokenVersion to invalidate old tokens
    if (updateFields.role && updateFields.role !== user.role) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      console.log(
        `🔄 Role changed for user ${userId}: ${user.role} → ${updateFields.role}, tokenVersion: ${user.tokenVersion}`
      );
    }

    // Merge regular fields
    Object.assign(user, updateFields);
    user.lastUpdate = new Date();

    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await deleteUserCascade(id, null);

    res.json({ message: "User deleted successfully", userId: id });
  } catch (err) {
    console.error("Error deleting user:", err);
    res
      .status(err.status || 500)
      .json({ message: "Error deleting user", error: err.message || err });
  }
};
