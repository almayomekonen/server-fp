const Comment = require('../models/Comment');

// יצירת הערה
exports.createComment = async (req, res) => {
  try {
    const { userId, copyId, text, offset } = req.body;
     
    if (!userId || !copyId || !text || offset == null) {
        return res.status(404).json({ message: 'נא למלא את כל הפרטים' });
    }

    const comment = new Comment({ userId, copyId, text, offset });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה ביצירת הערה', error: err });
  }
};

// קבלת כל ההערות
exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת הערות', error: err });
  }
};

// מחיקת הערה
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Comment.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'הערה לא נמצאה' });
        res.json({ message: 'הערה נמחקה בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה במחיקת הערה', error: err });
    }
};
