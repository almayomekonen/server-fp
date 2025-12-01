// models/Comparison.js
const mongoose = require("mongoose");

const comparisonSchema = new mongoose.Schema(
  {
    copyA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Copy",
      required: true,
    },
    copyB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Copy",
      required: true,
    },
  },
  { timestamps: true }
);

// To prevent duplicates - ensure each pair exists only once
comparisonSchema.index({ copyA: 1, copyB: 1 }, { unique: true });

module.exports = mongoose.model("Comparison", comparisonSchema);
