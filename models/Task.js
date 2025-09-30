// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
  copiesId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Copy' }],
  investigatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
