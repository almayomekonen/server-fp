const StyleSetting = require('../models/StyleSetting');

// קבלת ההגדרות
exports.getStyle = async (req, res) => {
  try {
    let style = await StyleSetting.findOne();
    if (!style) {
      style = new StyleSetting(); 
      await style.save();
    }
    res.json(style);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת הגדרות עיצוב', error: err });
  }
};

// עדכון ההגדרות
exports.updateStyle = async (req, res) => {

  try {
    let style = await StyleSetting.findOne();
    if (!style) {
      style = new StyleSetting(req.body);
    } else {
      Object.assign(style, req.body);
    }
    await style.save();
    res.json(style);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בעדכון הגדרות עיצוב', error: err });
  }
};
