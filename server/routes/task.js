// routes/task.js
const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task");
const { authenticate } = require("../middlewares/Auth");

router.post("/", authenticate, taskController.createTask);
router.get("/", authenticate, taskController.getAllTasks);
router.delete("/:id", authenticate, taskController.deleteTask);
router.put("/:id", authenticate, taskController.updateTask);

module.exports = router;
