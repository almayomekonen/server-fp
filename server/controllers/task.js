// controllers/task.js

const Task = require("../models/Task");
const { deleteTaskCascade } = require("../services/deleteCascade");
const mongoose = require("mongoose");

exports.createTask = async (req, res) => {
  try {
    const { experimentId, copiesId, investigatorId, coderId } = req.body;
    const task = new Task({ experimentId, copiesId, investigatorId, coderId });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "שגיאה ביצירת משימה", details: err });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "שגיאה בקבלת משימות", details: err });
  }
};

// עדכון כל שדה של משימה
exports.updateTask = async (req, res) => {
  const taskId = req.params.id;
  const updateFields = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "המשימה לא נמצאה" });

    // אם רוצים לבצע עדכון על מערך readBy
    if (updateFields.addCopy) {
      const copyId = updateFields.addCopy;
      if (!task.copiesId.includes(copyId)) {
        task.copiesId.push(copyId);
      }
      delete updateFields.addCopy;
    }

    // הסרת עותק מהמערך
    if (updateFields.removeCopy) {
      const copyId = updateFields.removeCopy;
      task.copiesId = task.copiesId.filter((id) => id.toString() !== copyId);
      delete updateFields.removeCopy;
    }

    Object.assign(task, updateFields);
    task.lastUpdate = new Date(); // אם את רוצה לעקוב אחרי עדכונים
    await task.save();

    res.json({ message: "המשימה עודכנה", task });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בעדכון המשימה", error: err });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    await deleteTaskCascade(id, null);

    res.json({ message: "המשימה נמחקה בהצלחה", taskId: id });
  } catch (err) {
    console.error("Error deleting task:", err);
    res
      .status(err.status || 500)
      .json({ message: "שגיאה במחיקת משימה", error: err.message || err });
  }
};
