const mongoose = require("mongoose");

const styleSchema = new mongoose.Schema({
  boldEnabled: { type: Boolean, default: true },
  boldName: { type: String, default: "Bold" },
  italicEnabled: { type: Boolean, default: false },
  italicName: { type: String, default: "Italic" },
  underlineEnabled: { type: Boolean, default: true },
  underlineName: { type: String, default: "Underline" },
});

module.exports = mongoose.model("StyleSetting", styleSchema);
