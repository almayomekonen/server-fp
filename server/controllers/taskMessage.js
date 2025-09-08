const TaskMessage = require('../models/TaskMessage');

// יצירת הודעה חדשה
exports.createMessage = async (req, res) => {
  try {
    const { taskId, senderId, text, replyToMessageId } = req.body;

    const message = new TaskMessage({ taskId, senderId, text, replyToMessageId });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה ביצירת הודעה', error: err });
  }
};

// קבלת כל ההודעות
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await TaskMessage.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת הודעות', error: err });
  }
};

// מחיקת הודעה
exports.deleteTaskMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await TaskMessage.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'הודעה לא נמצאה' });
        res.json({ message: 'הודעה נמחקה בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה במחיקת הודעה', error: err });
    }
};



// עדכון כל הודעה לפי שדות
exports.updateTaskMessage = async (req, res) => {
  const messageId = req.params.id;
  const updateFields = req.body; // כל השדות לעדכון


  try {
    const message = await TaskMessage.findById(messageId);
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
