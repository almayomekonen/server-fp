const Statement = require('../models/Statement');

const {
  deleteStatementCascade,
} = require('../services/deleteCascade');
const mongoose = require('mongoose');


// יצירת הצהרה
exports.createStatement = async (req, res) => {
  try {
    const {groupId, experimentId,name, slateText } = req.body;

    const statement = new Statement({ name, text: slateText, groupId, experimentId});
    await statement.save();
    res.status(201).json(statement);
  } catch (err) {
        console.error('שגיאה ביצירת הצהרה:', err);  // <- הוספתי לוג

    res.status(500).json({ message: 'שגיאה ביצירת הצהרה', error: err });
  }
};

// כל ההצהרות
exports.getAllStatements = async (req, res) => {
  try {
    const statements = await Statement.find();
    res.json(statements);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת הצהרות', error: err });
  }
};


exports.deleteStatement = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await deleteStatementCascade(id, session);
    });

    res.json({ message: 'הצהרה נמחקה בהצלחה', statementId: id });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'שגיאה במחיקת הצהרה', error: err.message || err });
  } finally {
    session.endSession();
  }
};



exports.getStatementById = async (req, res) => {
  try {
    const { id } = req.params;
    const statement = await Statement.findById(id);
    if (!statement) return res.status(404).json({ message: 'הצהרה לא נמצאה' });
    res.json(statement);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בטעינת הצהרה', error: err });
  }
};



exports.getStatementsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;
    const statements = await Statement.find({ groupId });
    res.json(statements);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בטעינת הצהרות לפי קבוצה', error: err });
  }
};

exports.getStatementsByExperimentId = async (req, res) => {
  try {
    const { experimentId } = req.params;
    const statements = await Statement.find({ experimentId });
    res.json(statements);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בטעינת הצהרות לפי ניסוי', error: err });
  }
};
