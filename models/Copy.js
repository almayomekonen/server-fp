const mongoose = require('mongoose');

const copySchema = new mongoose.Schema({
  statementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Statement', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
  coderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'in progress' },
  lastUpdate: { type: Date, default: Date.now },
  highlights: { type: Array, default: [] },
  colorCounts: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Copy', copySchema);
