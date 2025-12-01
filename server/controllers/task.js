// controllers/task.js

const Task = require("../models/Task");
const { deleteTaskCascade } = require("../services/deleteCascade");
const mongoose = require("mongoose");

exports.createTask = async (req, res) => {
  try {
    const { experimentId, copiesId, investigatorId, coderId } = req.body;
    const task = new Task({ experimentId, copiesId, investigatorId, coderId });
    await task.save();

    // 🔴 Emit real-time event
    if (global.io) {
      console.log(
        "🔴🔴🔴 [BACKEND] Emitting taskCreated event for task:",
        task._id
      );
      global.io.emit("taskCreated", { task: task.toObject() });
      console.log("✅ taskCreated event emitted successfully");
    } else {
      console.error("❌ global.io is not available! Socket.io not working!");
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Error creating task", details: err });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Error fetching tasks", details: err });
  }
};

// Update any field of a task
exports.updateTask = async (req, res) => {
  const taskId = req.params.id;
  const updateFields = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Handle adding copy to task
    if (updateFields.addCopy) {
      const copyId = updateFields.addCopy;
      if (!task.copiesId.includes(copyId)) {
        task.copiesId.push(copyId);
      }
      delete updateFields.addCopy;
    }

    // Handle removing copy from task
    if (updateFields.removeCopy) {
      const copyId = updateFields.removeCopy;
      task.copiesId = task.copiesId.filter((id) => id.toString() !== copyId);
      delete updateFields.removeCopy;
    }

    Object.assign(task, updateFields);
    task.lastUpdate = new Date();
    await task.save();

    // 🔴 Emit real-time event
    if (global.io) {
      console.log(
        "🔴🔴🔴 [BACKEND] Emitting taskUpdated event for task:",
        task._id
      );
      global.io.emit("taskUpdated", { task: task.toObject() });
      console.log("✅ taskUpdated event emitted successfully");
    } else {
      console.error("❌ global.io is not available! Socket.io not working!");
    }

    res.json({ message: "Task updated", task });
  } catch (err) {
    res.status(500).json({ message: "Error updating task", error: err });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    await deleteTaskCascade(id, null);

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("taskDeleted", { taskId: id });
    }

    res.json({ message: "Task deleted successfully", taskId: id });
  } catch (err) {
    console.error("Error deleting task:", err);
    res
      .status(err.status || 500)
      .json({ message: "Error deleting task", error: err.message || err });
  }
};
