const Comment = require("../models/Comment");

// Create comment
exports.createComment = async (req, res) => {
  try {
    const { userId, copyId, text, offset, replyTo } = req.body;

    if (!userId || !copyId || !text) {
      return res.status(404).json({ message: "Please fill in all details" });
    }

    const comment = new Comment({
      userId,
      copyId,
      text,
      offset,
      replyTo: replyTo || null,
    });
    await comment.save();

    // Populate user info for real-time emission
    await comment.populate("userId", "username");

    // 🔴 Emit real-time event to all connected clients
    if (global.io) {
      global.io.emit("commentCreated", {
        comment: comment.toObject(),
        copyId: copyId,
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: "Error creating comment", error: err });
  }
};

// Get all comments
exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find().populate("userId", "username");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Error getting comments", error: err });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Comment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Comment not found" });

    // 🔴 Emit real-time event to all connected clients
    if (global.io) {
      global.io.emit("commentDeleted", {
        commentId: id,
        copyId: deleted.copyId,
      });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting comment", error: err });
  }
};
