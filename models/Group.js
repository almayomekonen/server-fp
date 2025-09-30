const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
