const CopyMessage = require("../models/CopyMessage");

// Create new message
exports.createMessage = async (req, res) => {
  try {
    const { copyId, senderId, text, replyToMessageId } = req.body;

    const message = new CopyMessage({
      copyId,
      senderId,
      text,
      replyToMessageId,
    });
    await message.save();

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("copyMessageCreated", { message: message.toObject() });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Error creating message", error: err });
  }
};

// קבלת כל ההודעות
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await CopyMessage.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "שגיאה בקבלת הודעות", error: err });
  }
};

// Delete message
exports.deleteCopyMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CopyMessage.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Message not found" });

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("copyMessageDeleted", { messageId: id });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting message", error: err });
  }
};

// Update message by fields
exports.updateCopyMessage = async (req, res) => {
  const messageId = req.params.id;
  const updateFields = req.body;

  try {
    const message = await CopyMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Handle adding to readBy array
    if (updateFields.addToReadBy) {
      const userId = updateFields.addToReadBy;
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
      delete updateFields.addToReadBy;
    }

    // Update other fields
    Object.assign(message, updateFields);

    await message.save();

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("copyMessageUpdated", { message: message.toObject() });
    }

    res.json({ message: "Message updated", messageDoc: message });
  } catch (err) {
    res.status(500).json({ message: "Error updating message", error: err });
  }
};

// controllers/copyMessage.js

// קבלת כל ההודעות להעתק מסוים
exports.getMessagesForCopy = async (req, res) => {
  try {
    const { copyId } = req.params;
    const messages = await CopyMessage.find({ copyId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "שגיאה בקבלת הודעות להעתק", error: err });
  }
};

// קבלת מספר הודעות שלא נקראו עבור משתמש בהעתק
exports.getUnreadCount = async (req, res) => {
  try {
    const { copyId, userId } = req.params;
    const count = await CopyMessage.countDocuments({
      copyId,
      readBy: { $ne: userId },
    });
    res.json({ count });
  } catch (err) {
    res
      .status(500)
      .json({ message: "שגיאה בקבלת כמות הודעות לא נקראו", error: err });
  }
};

// קבלת הודעה לפי ID
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await CopyMessage.findById(id);
    if (!message) return res.status(404).json({ message: "הודעה לא נמצאה" });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: "שגיאה בקבלת הודעה", error: err });
  }
};
