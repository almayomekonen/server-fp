const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Color name (yellow, green)
  code: { type: String, required: true }, // HEX code example "#FFFF00"
});

module.exports = mongoose.model("Color", colorSchema);
