const mongoose = require('mongoose');

const copyMessageSchema = new mongoose.Schema({
  copyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Copy', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replyToMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'CopyMessage', default: null }
}, { timestamps: true }); // יוצר אוטומטית createdAt ו-updatedAt

module.exports = mongoose.model('CopyMessage', copyMessageSchema);
