// controllers/statementController.js

const Statement = require("../models/Statement");
const Copy = require("../models/Copy");
const Comment = require("../models/Comment");
const Comparison = require("../models/Comparison");

// יצירת הצהרה
exports.createStatement = async (req, res) => {
  try {
    const { name, slateText, groupId, experimentId } = req.body;
    const statement = new Statement({ name, slateText, groupId, experimentId });
    await statement.save();
    res.status(201).json(statement);
  } catch (err) {
    res.status(500).json({ message: "Error creating statement", error: err });
  }
};

// קבלת כל ההצהרות
exports.getAllStatements = async (req, res) => {
  try {
    const statements = await Statement.find();
    // ✅ ודא שיש slateText לכל statement (תאימות לאחור)
    statements.forEach((statement) => {
      if (!statement.slateText && statement.text) {
        statement.slateText = statement.text;
      }
    });
    res.json(statements);
  } catch (err) {
    res.status(500).json({ message: "Error getting statements", error: err });
  }
};

// קבלת הצהרות לפי קבוצה
exports.getStatementsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;
    const statements = await Statement.find({ groupId });
    // ✅ ודא שיש slateText לכל statement (תאימות לאחור)
    statements.forEach((statement) => {
      if (!statement.slateText && statement.text) {
        statement.slateText = statement.text;
      }
    });
    res.json(statements);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error getting statements by group", error: err });
  }
};

// קבלת הצהרות לפי ניסוי
exports.getStatementsByExperimentId = async (req, res) => {
  try {
    const { experimentId } = req.params;
    const statements = await Statement.find({ experimentId });
    // ✅ ודא שיש slateText לכל statement (תאימות לאחור)
    statements.forEach((statement) => {
      if (!statement.slateText && statement.text) {
        statement.slateText = statement.text;
      }
    });
    res.json(statements);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error getting statements by experiment", error: err });
  }
};

// קבלת הצהרה לפי ID
exports.getStatementById = async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id);
    if (!statement) {
      return res.status(404).json({ message: "Statement not found" });
    }

    // ✅ ודא שיש slateText (תאימות לאחור)
    if (!statement.slateText && statement.text) {
      statement.slateText = statement.text;
    }

    res.json(statement);
  } catch (err) {
    res.status(500).json({ message: "Error getting statement", error: err });
  }
};

// מחיקת הצהרה עם מחיקה קשקדית של כל התלויות
exports.deleteStatement = async (req, res) => {
  const { id } = req.params;

  try {
    // בדיקה שההצהרה קיימת
    const statement = await Statement.findById(id);
    if (!statement) {
      return res.status(404).json({ message: "Statement not found" });
    }

    // שלב 1: מצא את כל העותקים של ההצהרה
    const copies = await Copy.find({ statementId: id });
    const copyIds = copies.map((c) => c._id);

    // שלב 2: מחק את כל ההערות של העותקים
    if (Comment) {
      await Comment.deleteMany({ copyId: { $in: copyIds } });
    }

    // שלב 3: מחק את כל ההשוואות של העותקים
    if (Comparison) {
      await Comparison.deleteMany({
        $or: [{ copyId1: { $in: copyIds } }, { copyId2: { $in: copyIds } }],
      });
    }

    // שלב 4: מחק את כל העותקים
    await Copy.deleteMany({ statementId: id });

    // שלב 5: מחק את ההצהרה עצמה
    await Statement.findByIdAndDelete(id);

    res.json({
      message: "Statement and all dependencies deleted successfully",
      statementId: id,
    });
  } catch (err) {
    console.error("Error deleting statement:", err);
    res.status(500).json({
      message: "Error deleting statement",
      error: err.message,
    });
  }
};

// עדכון הצהרה
exports.updateStatement = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const updated = await Statement.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Statement not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating statement", error });
  }
};
