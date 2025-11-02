const TaskMessage = require("../models/TaskMessage");

// Create new message
exports.createMessage = async (req, res) => {
  try {
    const { taskId, senderId, text, replyToMessageId } = req.body;

    const message = new TaskMessage({
      taskId,
      senderId,
      text,
      replyToMessageId,
    });
    await message.save();

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("taskMessageCreated", { message: message.toObject() });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Error creating message", error: err });
  }
};

// Get all messages
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await TaskMessage.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error getting messages", error: err });
  }
};

// Delete message
exports.deleteTaskMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TaskMessage.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Message not found" });

    // 🔴 Emit real-time event
    if (global.io) {
      global.io.emit("taskMessageDeleted", { messageId: id });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting message", error: err });
  }
};

// Update message by fields
exports.updateTaskMessage = async (req, res) => {
  const messageId = req.params.id;
  const updateFields = req.body;

  try {
    const message = await TaskMessage.findById(messageId);
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
      global.io.emit("taskMessageUpdated", { message: message.toObject() });
    }

    res.json({ message: "Message updated", messageDoc: message });
  } catch (err) {
    res.status(500).json({ message: "Error updating message", error: err });
  }
};
