const mongoose = require('mongoose');

const taskMessageSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replyToMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskMessage', default: null }
}, { timestamps: true }); // יוסיף createdAt ו־updatedAt אוטומטית

module.exports = mongoose.model('TaskMessage', taskMessageSchema);
