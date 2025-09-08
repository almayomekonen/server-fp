const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },   // שם הצבע (yellow, green)
  code: { type: String, required: true }    // קוד HEX לדוגמה "#FFFF00"
});

module.exports = mongoose.model('Color', colorSchema);
