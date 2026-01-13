const Comparison = require("../models/Comparison");
exports.createComparison = async (req, res) => {
  let { copyId1, copyId2 } = req.body;
  if (!copyId1 || !copyId2 || copyId1 === copyId2) {
    return res.status(400).json({ message: "Invalid parameters" });
  }

  try {
    if (copyId1 > copyId2) [copyId1, copyId2] = [copyId2, copyId1];

    const exists = await Comparison.findOne({ copyA: copyId1, copyB: copyId2 });
    if (exists) {
      return res
        .status(200)
        .json({ message: "Comparison already exists", comparison: exists });
    }

    const comparison = new Comparison({ copyA: copyId1, copyB: copyId2 });
    await comparison.save();

    res.status(201).json(comparison);
  } catch (err) {
    console.error("Error adding comparison:", err);
    res.status(500).json({ message: "Error adding comparison", error: err });
  }
};

exports.deleteComparison = async (req, res) => {
  try {
    const { copyId1, copyId2 } = req.body;
    let [a, b] = copyId1 > copyId2 ? [copyId2, copyId1] : [copyId1, copyId2];
    const deleted = await Comparison.findOneAndDelete({ copyA: a, copyB: b });
    if (!deleted)
      return res.status(404).json({ message: "Comparison not found" });

    if (global.io) {
      global.io.emit("comparisonCancelled", {
        copyId1: a,
        copyId2: b,
        message: "Comparison has been cancelled by the researcher",
      });
    }

    res.json({ message: "Comparison deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting comparison", error: err });
  }
};

exports.removeAllComparisons = async (req, res) => {
  const { copyId } = req.body;

  try {
    await Comparison.deleteMany({
      $or: [{ copyA: copyId }, { copyB: copyId }],
    });

    res.json({ message: "All comparisons for copy removed successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error removing all comparisons", error: err });
  }
};

exports.getAllComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.find();
    res.json(comparisons);
  } catch (err) {
    res.status(500).json({ message: "Error fetching comparisons", error: err });
  }
};

exports.getComparisonsForCopyById = async (req, res) => {
  const { copyId } = req.params;

  try {
    const comparisons = await Comparison.find({
      $or: [{ copyA: copyId }, { copyB: copyId }],
    });

    // Return only the IDs of the second copy
    const result = comparisons.map((c) =>
      c.copyA.toString() === copyId ? c.copyB : c.copyA
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching comparisons", error: err });
  }
};

// Check if comparison already exists
exports.checkComparisonExists = async (req, res) => {
  let { copyId1, copyId2 } = req.body;
  if (!copyId1 || !copyId2 || copyId1 === copyId2) {
    return res.status(400).json({ message: "Invalid parameters" });
  }

  try {
    if (copyId1 > copyId2) [copyId1, copyId2] = [copyId2, copyId1];

    const exists = await Comparison.findOne({ copyA: copyId1, copyB: copyId2 });
    res.json({ exists: !!exists }); // Return true or false
  } catch (err) {
    console.error("Error checking comparison:", err);
    res.status(500).json({ message: "Error checking comparison", error: err });
  }
};
