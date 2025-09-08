const express = require("express");
const router = express.Router();
const taskMessageController = require("../controllers/taskMessage");
const { authenticate } = require("../middlewares/Auth");

router.post("/", authenticate, taskMessageController.createMessage);
router.get("/", authenticate, taskMessageController.getAllMessages);
router.delete("/:id", authenticate, taskMessageController.deleteTaskMessage);
router.put("/:id", authenticate, taskMessageController.updateTaskMessage);

module.exports = router;
