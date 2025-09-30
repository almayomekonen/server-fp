const mongoose = require('mongoose');

const styleSchema = new mongoose.Schema({
  boldEnabled: { type: Boolean, default: true },
  italicEnabled: { type: Boolean, default: false },
  underlineEnabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('StyleSetting', styleSchema);
