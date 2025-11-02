const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    copyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Copy",
      required: true,
    },
    text: { type: String, required: true },
    offset: { type: Number }, // For positioning comment on specific text location
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    }, // Parent comment ID for replies
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
