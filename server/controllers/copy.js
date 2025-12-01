// controllers/copyController.js
const mongoose = require("mongoose");
const Copy = require("../models/Copy");
const { deleteCopyCascade } = require("../services/deleteCascade");

exports.createCopy = async (req, res) => {
  try {
    const copy = new Copy(req.body);
    await copy.save();

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("copyCreated", { copy: copy.toObject() });
    }

    res.status(201).json(copy);
  } catch (err) {
    console.error("Error creating copy:", err);
    res.status(500).json({ message: "Error creating copy", error: err });
  }
};

exports.getAllCopies = async (req, res) => {
  try {
    const copies = await Copy.find();
    res.json(copies);
  } catch (err) {
    res.status(500).json({ message: "Error fetching copies", error: err });
  }
};

exports.updateCopy = async (req, res) => {
  const copyId = req.params.id;
  const updateFields = req.body;

  try {
    const copy = await Copy.findById(copyId);
    if (!copy) return res.status(404).json({ message: "Copy not found" });

    Object.assign(copy, updateFields);
    copy.lastUpdate = new Date();
    await copy.save();

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("copyUpdated", { copy: copy.toObject() });
    }

    res.json({ message: "Copy updated", copy });
  } catch (err) {
    res.status(500).json({ message: "Error updating copy", error: err });
  }
};

exports.deleteCopy = async (req, res) => {
  const { id } = req.params;

  try {
    await deleteCopyCascade(id, null);

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("copyDeleted", { copyId: id });
    }

    res.json({ message: "Copy deleted successfully", copyId: id });
  } catch (err) {
    console.error("Error deleting copy:", err);
    res
      .status(err.status || 500)
      .json({ message: "Error deleting copy", error: err.message || err });
  }
};
