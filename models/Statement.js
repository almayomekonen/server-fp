const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: Array, required: true }, // שמירה כ־JSON: טקסט עשיר
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Statement', statementSchema);
