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
    res.status(500).json({ message: "Error creating experiment", error: err });
  }
};

// קבלת כל הניסויים
exports.getAllExperiments = async (req, res) => {
  try {
    const experiments = await Experiment.find();
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ message: "Error getting experiments", error: err });
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
    res.status(500).json({ message: "Error updating experiment", error });
  }
};

exports.getExperimentsByInvestigatorId = async (req, res) => {
  try {
    const { investigatorId } = req.params;

    const experiments = await Experiment.find({ investigatorId });
    res.json(experiments);
  } catch (err) {
    res.status(500).json({
      message: "Error getting experiments by investigator",
      error: err,
    });
  }
};

exports.getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment)
      return res.status(404).json({ message: "Experiment not found" });
    res.json(experiment);
  } catch (err) {
    res.status(500).json({ message: "Error getting experiment", error: err });
  }
};

exports.getInvestigatorNameByExperimentId = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment)
      return res.status(404).json({ message: "Experiment not found" });

    const user = await User.findById(experiment.investigatorId);
    if (!user) return res.status(404).json({ message: "Researcher not found" });

    res.json(user.username);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error getting investigator name", error: err });
  }
};

exports.deleteExperiment = async (req, res) => {
  const { id } = req.params;

  try {
    await deleteExperimentCascade(id, null);

    console.log(`✅ Experiment deleted successfully: ${id}`);
    res.json({ message: "Experiment deleted successfully", experimentId: id });
  } catch (err) {
    console.error(`❌ Error deleting experiment ${id}:`, err);
    console.error("Stack:", err.stack);
    res.status(err.status || 500).json({
      message: "Error deleting experiment",
      error: err.message || err,
    });
  }
};
