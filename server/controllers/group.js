
const Group = require('../models/Group');
const {
  deleteGroupCascade,
} = require('../services/deleteCascade');
const mongoose = require('mongoose');


// יצירת קבוצה
exports.createGroup = async (req, res) => {
  try {
    const { name, description, experimentId } = req.body;
    const group = new Group({ name, description, experimentId });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה ביצירת קבוצה', error: err });
  }
};

// קבלת כל הקבוצות
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת קבוצות', error: err });
  }
};

exports.deleteGroup = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await deleteGroupCascade(id, session);
    });

    res.json({ message: 'הקבוצה נמחקה בהצלחה', groupId: id });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'שגיאה במחיקת קבוצה', error: err.message || err });
  } finally {
    session.endSession();
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