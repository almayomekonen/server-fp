const Group = require("../models/Group");
const { deleteGroupCascade } = require("../services/deleteCascade");
const mongoose = require("mongoose");

// Create group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, experimentId } = req.body;
    const group = new Group({ name, description, experimentId });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: "Error creating group", error: err });
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Error fetching groups", error: err });
  }
};

exports.deleteGroup = async (req, res) => {
  const { id } = req.params;

  try {
    // Find copies that will be deleted to emit events
    const copiesToDelete = await Copy.find({ groupId: id });

    await deleteGroupCascade(id, null);

    // 🔴 Emit real-time events for deleted copies
    if (global.io && copiesToDelete.length > 0) {
      copiesToDelete.forEach((copy) => {
        global.io.emit("copyDeleted", { copyId: copy._id });
        console.log(
          `🔴 [BACKEND] Emitted copyDeleted for cascading copy: ${copy._id}`
        );
      });
    }

    res.json({ message: "Group deleted successfully", groupId: id });
  } catch (err) {
    console.error("Error deleting group:", err);
    res
      .status(err.status || 500)
      .json({ message: "Error deleting group", error: err.message || err });
  }
};

exports.getGroupsByExperimentId = async (req, res) => {
  try {
    const { experimentId } = req.params;
    const groups = await Group.find({ experimentId });
    res.json(groups);
  } catch (err) {
    console.error("Error fetching groups by experimentId:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    console.error("Error fetching group by ID:", err);
    res.status(500).json({ error: "Server error" });
  }
};
