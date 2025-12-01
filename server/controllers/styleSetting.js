const StyleSetting = require("../models/StyleSetting");

// Get settings
exports.getStyle = async (req, res) => {
  try {
    let style = await StyleSetting.findOne();
    if (!style) {
      style = new StyleSetting();
      await style.save();
    }
    res.json(style);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching style settings", error: err });
  }
};

// Update settings
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
    res
      .status(500)
      .json({ message: "Error updating style settings", error: err });
  }
};
