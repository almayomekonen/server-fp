// controllers/experimentController.js

const User = require("../models/User");

const Task = require("../models/Task");
const Experiment = require("../models/Experiment");
const { deleteExperimentCascade } = require("../services/deleteCascade");

// Create experiment
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

// Get all experiments
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
    // Find tasks to be deleted before cascade
    const tasksToDelete = await Task.find({ experimentId: id });

    const copiesToDelete = await require("../models/Copy").find({
      experimentId: id,
    });

    await deleteExperimentCascade(id, null);

    // 🔴 Emit real-time events for deleted tasks
    if (global.io && tasksToDelete.length > 0) {
      tasksToDelete.forEach((task) => {
        global.io.emit("taskDeleted", { taskId: task._id });
        console.log(
          `🔴 [BACKEND] Emitted taskDeleted for cascading task: ${task._id}`
        );
      });
    }

    // 🔴 Emit real-time events for deleted copies
    if (global.io && copiesToDelete.length > 0) {
      copiesToDelete.forEach((copy) => {
        global.io.emit("copyDeleted", { copyId: copy._id });
        console.log(
          `🔴 [BACKEND] Emitted copyDeleted for cascading copy: ${copy._id}`
        );
      });
    }

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
