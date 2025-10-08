const mongoose = require("mongoose");

const statementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slateText: { type: Array, required: false }, // ✅ שדה חדש
    text: { type: Array, required: false }, // ⚠️ שדה ישן - לתאימות לאחור
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

// 🔄 Middleware: ממיר אוטומטית text -> slateText לפני שמירה
statementSchema.pre("save", function (next) {
  // אם יש text אבל אין slateText, העתק את text ל-slateText
  if (this.text && !this.slateText) {
    this.slateText = this.text;
  }
  // אם יש slateText, ודא שגם text מעודכן (לתאימות לאחור)
  if (this.slateText) {
    this.text = this.slateText;
  }
  next();
});

// 🔍 Middleware: ממיר אוטומטית text -> slateText אחרי קריאה מה-DB
// זה יפעל גם על find, findOne, findById
const convertTextToSlateText = function (doc) {
  if (doc) {
    // אם יש text אבל אין slateText (או slateText ריק), העתק מ-text
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
