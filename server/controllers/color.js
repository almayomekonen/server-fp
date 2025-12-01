const Color = require("../models/Color");

// Get all colors
exports.getColors = async (req, res) => {
  try {
    const colors = await Color.find();
    res.json(colors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching colors", error: err });
  }
};

// Create new color
exports.createColor = async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({ message: "Please select a color" });
  }

  try {
    const color = new Color({ name, code });
    await color.save();
    res.status(201).json(color);
  } catch (err) {
    res.status(500).json({ message: "Error creating color", error: err });
  }
};

// Delete color
exports.deleteColor = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Color.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Color not found" });
    res.json({ message: "Color deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting color", error: err });
  }
};
