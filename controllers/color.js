const Color = require('../models/Color');

// קבלת כל הצבעים
exports.getColors = async (req, res) => {
  try {
    const colors = await Color.find();
    res.json(colors);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת צבעים', error: err });
  }
};

// יצירת צבע חדש
exports.createColor = async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
      return res.status(400).json({ message: 'נא לבחור צבע' });
  }

  try {
    const color = new Color({ name, code });
    await color.save();
    res.status(201).json(color);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה ביצירת צבע', error: err });
  }
};

// מחיקת צבע
exports.deleteColor = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Color.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'צבע לא נמצא' });
        res.json({ message: 'צבע נמחק בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה במחיקת צבע', error: err });
    }
};


