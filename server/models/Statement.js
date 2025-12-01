const mongoose = require("mongoose");

const statementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slateText: { type: Array, required: false }, // ✅ New field
    text: { type: Array, required: false }, // ⚠️ Old field - for backward compatibility
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    experimentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experiment",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔄 Middleware: Automatically convert text -> slateText before saving
statementSchema.pre("save", function (next) {
  // If there's text but no slateText, copy text to slateText
  if (this.text && !this.slateText) {
    this.slateText = this.text;
  }
  // If there's slateText, ensure text is also updated (for backward compatibility)
  if (this.slateText) {
    this.text = this.slateText;
  }
  next();
});

// 🔍 Middleware: Automatically convert text -> slateText after reading from DB
// This will work for find, findOne, findById
const convertTextToSlateText = function (doc) {
  if (doc) {
    // If there's text but no slateText (or slateText is empty), copy from text
    if (doc.text && (!doc.slateText || doc.slateText.length === 0)) {
      doc.slateText = doc.text;
    }
  }
};

statementSchema.post("find", function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach(convertTextToSlateText);
  }
});

statementSchema.post("findOne", function (doc) {
  convertTextToSlateText(doc);
});

statementSchema.post("findById", function (doc) {
  convertTextToSlateText(doc);
});

module.exports = mongoose.model("Statement", statementSchema);
