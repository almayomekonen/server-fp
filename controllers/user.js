//controllers/user.js

const mongoose = require('mongoose');

const User = require('../models/User');
const {
  deleteUserCascade,
} = require('../services/deleteCascade');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash"); 
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשרת', err });
  }
};



exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const updateFields = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    // אם רוצים לעדכן סיסמה חדשה – נטפל בזה בנפרד
    if (updateFields.newPassword) {
      await user.setPassword(updateFields.newPassword);
      delete updateFields.newPassword;
    }

    // מיזוג שדות רגילים
    Object.assign(user, updateFields);
    user.lastUpdate = new Date();

    await user.save();

    res.json({ message: 'המשתמש עודכן בהצלחה', user });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בעדכון המשתמש', error: err });
  }
};


exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await deleteUserCascade(id, session);
    });

    res.json({ message: 'המשתמש נמחק בהצלחה', userId: id });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'שגיאה במחיקת משתמש', error: err.message || err });
  } finally {
    session.endSession();
  }
};

