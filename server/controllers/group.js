const Group = require("../models/Group");
const Copy = require("../models/Copy");
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
    // Find all statements and copies that will be deleted before cascade
    const Statement = require("../models/Statement");
    const statements = await Statement.find({ groupId: id });
    const statementIds = statements.map(s => s._id.toString());
    
    // Find all copies under these statements
    let copiesToDelete = [];
    for (const statement of statements) {
      const copies = await Copy.find({ statementId: statement._id });
      copiesToDelete = copiesToDelete.concat(copies);
    }
    const copyIds = copiesToDelete.map(c => c._id.toString());

    // Perform cascade deletion
    await deleteGroupCascade(id, null);

    // 🔴 Emit real-time events for all cascaded deletions
    if (global.io) {
      console.log(`🔴 [GROUP DELETE CASCADE] Emitting events for group ${id}`);
      
      // Emit statement deletions
      statementIds.forEach(statementId => {
        global.io.emit("statementDeleted", { statementId });
        console.log(`  ✅ Emitted statementDeleted: ${statementId}`);
      });

      // Emit copy deletions
      copyIds.forEach(copyId => {
        global.io.emit("copyDeleted", { copyId });
        console.log(`  ✅ Emitted copyDeleted: ${copyId}`);
      });

      // Emit group deletion
      global.io.emit("groupDeleted", { groupId: id });
      console.log(`  ✅ Emitted groupDeleted: ${id}`);

      console.log(`🔴 [GROUP DELETE CASCADE] Completed: ${statementIds.length} statements, ${copyIds.length} copies`);
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
