
// controllers/copyController.js
const mongoose = require('mongoose');
const Copy = require('../models/Copy');
const {
  deleteCopyCascade,
} = require('../services/deleteCascade');

exports.createCopy = async (req, res) => {
  try {
    const copy = new Copy(req.body);
    await copy.save();
    res.status(201).json(copy);
  } catch (err) {
    console.error('שגיאה ביצירת עותק:', err);
    res.status(500).json({ message: 'שגיאה ביצירת עותק', error: err });
  }
};

exports.getAllCopies = async (req, res) => {
  try {
    const copies = await Copy.find();
    res.json(copies);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת העותקים', error: err });
  }
};





exports.updateCopy = async (req, res) => {
  const copyId = req.params.id; // לקיחת ה-id מהפרמטרים
  const updateFields = req.body; // השדות לעדכון

  try {
    const copy = await Copy.findById(copyId);
    if (!copy) return res.status(404).json({ message: 'עותק לא נמצא' });

    Object.assign(copy, updateFields);
    copy.lastUpdate = new Date();
    await copy.save();

    res.json({ message: 'העותק עודכן', copy });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בעדכון העתק', error: err });
  }
};

exports.deleteCopy = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await deleteCopyCascade(id, session);
    });

    res.json({ message: 'העותק נמחק בהצלחה', copyId: id });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'שגיאה במחיקת העתק', error: err.message || err });
  } finally {
    session.endSession();
  }
};
