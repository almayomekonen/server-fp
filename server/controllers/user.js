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

    if (updateFields.newPassword) {
      await user.setPassword(updateFields.newPassword);
      delete updateFields.newPassword;
    }

    if (updateFields.role && updateFields.role !== user.role) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

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

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("userDeleted", { userId: id });
    }

    res.json({ message: "User deleted successfully", userId: id });
  } catch (err) {
    console.error("Error deleting user:", err);
    res
      .status(err.status || 500)
      .json({ message: "Error deleting user", error: err.message || err });
  }
};
