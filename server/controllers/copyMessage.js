const CopyMessage = require('../models/CopyMessage');


// יצירת הודעה חדשה
exports.createMessage = async (req, res) => {
  try {
    const { copyId, senderId, text, replyToMessageId } = req.body;

    const message = new CopyMessage({ copyId, senderId, text, replyToMessageId });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה ביצירת הודעה', error: err });
  }
};

// קבלת כל ההודעות
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await CopyMessage.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת הודעות', error: err });
  }
};

// מחיקת הודעה

exports.deleteCopyMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CopyMessage.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'הודעה לא נמצאה' });
        res.json({ message: 'הודעה נמחקה בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה במחיקת הודעה', error: err });
    }
};



// עדכון כל הודעה לפי שדות
exports.updateCopyMessage = async (req, res) => {
  const messageId = req.params.id;
  const updateFields = req.body; // כל השדות לעדכון


  try {
    const message = await CopyMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: 'הודעה לא נמצאה' });

    // אם רוצים לבצע עדכון על מערך readBy
    if (updateFields.addToReadBy) {
      const userId = updateFields.addToReadBy;
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
      delete updateFields.addToReadBy;
    }

    // עדכון שדות אחרים
    Object.assign(message, updateFields);

    await message.save();
    res.json({ message: 'הודעה עודכנה', messageDoc: message });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בעדכון ההודעה', error: err });
  }
};



// controllers/copyMessage.js

// קבלת כל ההודעות להעתק מסוים
exports.getMessagesForCopy = async (req, res) => {
  try {
    const { copyId } = req.params;
    const messages = await CopyMessage.find({ copyId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת הודעות להעתק', error: err });
  }
};

// קבלת מספר הודעות שלא נקראו עבור משתמש בהעתק
exports.getUnreadCount = async (req, res) => {
  try {
    const { copyId, userId } = req.params;
    const count = await CopyMessage.countDocuments({
      copyId,
      readBy: { $ne: userId }
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת כמות הודעות לא נקראו', error: err });
  }
};

// קבלת הודעה לפי ID
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await CopyMessage.findById(id);
    if (!message) return res.status(404).json({ message: 'הודעה לא נמצאה' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת הודעה', error: err });
  }
};

