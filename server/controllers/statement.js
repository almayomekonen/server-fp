// controllers/statementController.js

const Statement = require("../models/Statement");
const { deleteStatementCascade } = require("../services/deleteCascade");

// Create statement
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

// Get all statements
exports.getAllStatements = async (req, res) => {
  try {
    const statements = await Statement.find();
    // ✅ Ensure slateText exists for each statement (backward compatibility)
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

// Get statements by group
exports.getStatementsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;
    const statements = await Statement.find({ groupId });
    // ✅ Ensure slateText exists for each statement (backward compatibility)
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

// Get statements by experiment
exports.getStatementsByExperimentId = async (req, res) => {
  try {
    const { experimentId } = req.params;
    const statements = await Statement.find({ experimentId });
    // ✅ Ensure slateText exists for each statement (backward compatibility)
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

// Get statement by ID
exports.getStatementById = async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id);
    if (!statement) {
      return res.status(404).json({ message: "Statement not found" });
    }

    // ✅ Ensure slateText exists (backward compatibility)
    if (!statement.slateText && statement.text) {
      statement.slateText = statement.text;
    }

    res.json(statement);
  } catch (err) {
    res.status(500).json({ message: "Error getting statement", error: err });
  }
};

// Delete statement with full cascade deletion of all dependencies
exports.deleteStatement = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if statement exists
    const statement = await Statement.findById(id);
    if (!statement) {
      return res.status(404).json({ message: "Statement not found" });
    }

    // Use cascade service to delete statement and all dependencies:
    // - All copies under this statement
    // - All copy messages for those copies
    // - All comments for those copies
    // - All comparisons involving those copies
    // - Remove copies from Task copiesId arrays
    await deleteStatementCascade(id, null);

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

// Update statement
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
