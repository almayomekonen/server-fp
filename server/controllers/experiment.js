// controllers/experimentController.js

const User = require("../models/User");
const mongoose = require("mongoose");

const Experiment = require("../models/Experiment");
const { deleteExperimentCascade } = require("../services/deleteCascade");

// יצירת ניסוי
exports.createExperiment = async (req, res) => {
  try {
    const { name, description, investigatorId, defaultTaskId } = req.body;
    const experiment = new Experiment({
      name,
      description,
      investigatorId,
      defaultTaskId,
    });
    await experiment.save();
    res.status(201).json(experiment);
  } catch (err) {
    res.status(500).json({ message: "שגיאה ביצירת ניסוי", error: err });
  }
};

// קבלת כל הניסויים
exports.getAllExperiments = async (req, res) => {
  try {
    const experiments = await Experiment.find();
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ message: "שגיאה בקבלת ניסויים", error: err });
  }
};

exports.updateExperiment = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const updated = await Experiment.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "שגיאה בעדכון ניסוי", error });
  }
};

// קבלת ניסויים לפי מזהה חוקר
exports.getExperimentsByInvestigatorId = async (req, res) => {
  try {
    const { investigatorId } = req.params;

    // מחפש את כל הניסויים עם ה־investigatorId הזה
    const experiments = await Experiment.find({ investigatorId });
    res.json(experiments);
  } catch (err) {
    res
      .status(500)
      .json({ message: "שגיאה בקבלת ניסויים לפי מזהה חוקר", error: err });
  }
};

// קבלת ניסוי לפי מזהה
exports.getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) return res.status(404).json({ message: "ניסוי לא נמצא" });
    res.json(experiment);
  } catch (err) {
    res.status(500).json({ message: "שגיאה בקבלת ניסוי", error: err });
  }
};

// קבלת שם החוקר לפי ניסוי
exports.getInvestigatorNameByExperimentId = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) return res.status(404).json({ message: "ניסוי לא נמצא" });

    const user = await User.findById(experiment.investigatorId);
    if (!user) return res.status(404).json({ message: "חוקר לא נמצא" });

    res.json(user.username);
  } catch (err) {
    res.status(500).json({ message: "שגיאה בקבלת שם החוקר", error: err });
  }
};

exports.deleteExperiment = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await deleteExperimentCascade(id, session);
    });

    res.json({ message: "הניסוי נמחק בהצלחה", experimentId: id });
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ message: "שגיאה במחיקת ניסוי", error: err.message || err });
  } finally {
    session.endSession();
  }
};
