// models/Experiment.js
const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  investigatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  defaultTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
}, { timestamps: true });

module.exports = mongoose.model('Experiment', experimentSchema);
