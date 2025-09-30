// routes/copyMessages.js
const express = require("express");
const router = express.Router();
const copyMessageController = require("../controllers/copyMessage");
const { authenticate } = require("../middlewares/Auth");

router.post("/", authenticate, copyMessageController.createMessage);
router.get("/", authenticate, copyMessageController.getAllMessages);
router.delete("/:id", authenticate, copyMessageController.deleteCopyMessage);
router.put("/:id", authenticate, copyMessageController.updateCopyMessage);

// פונקציות חדשות
router.get("/byCopy/:copyId", copyMessageController.getMessagesForCopy);
router.get(
  "/unreadCount/:copyId/:userId",
  copyMessageController.getUnreadCount
);
router.get("/byId/:id", copyMessageController.getMessageById);

module.exports = router;
