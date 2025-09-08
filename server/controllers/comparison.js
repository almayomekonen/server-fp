const Comparison = require('../models/Comparison');
exports.createComparison = async (req, res) => {
  let { copyId1, copyId2 } = req.body;
  if (!copyId1 || !copyId2 || copyId1 === copyId2) {
    return res.status(400).json({ message: 'פרמטרים לא חוקיים' });
  }

  try {
    // מוודאים שאין כפילות (copyA תמיד קטן יותר)
    if (copyId1 > copyId2) [copyId1, copyId2] = [copyId2, copyId1];

    const exists = await Comparison.findOne({ copyA: copyId1, copyB: copyId2 });
    if (exists) {
      return res.status(200).json({ message: 'השוואה כבר קיימת', comparison: exists });
    }

    const comparison = new Comparison({ copyA: copyId1, copyB: copyId2 });
    await comparison.save();

    res.status(201).json(comparison);
  } catch (err) {
    console.error('שגיאה בהוספת השוואה:', err);
    res.status(500).json({ message: 'שגיאה בהוספת השוואה', error: err });
  }
};


exports.deleteComparison = async (req, res) => {
    try {
        const { copyId1, copyId2 } = req.body;
        let [a, b] = copyId1 > copyId2 ? [copyId2, copyId1] : [copyId1, copyId2];
        const deleted = await Comparison.findOneAndDelete({ copyA: a, copyB: b });
        if (!deleted) return res.status(404).json({ message: 'השוואה לא נמצאה' });
        res.json({ message: 'השוואה נמחקה בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה במחיקת השוואה', error: err });
    }
};

exports.removeAllComparisons = async (req, res) => {
  const { copyId } = req.body;

  try {
    // מוחק כל השוואה שבה העתק מעורב
    await Comparison.deleteMany({
      $or: [{ copyA: copyId }, { copyB: copyId }]
    });

    res.json({ message: 'כל ההשוואות של העותק הוסרו בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בהסרת כל ההשוואות', error: err });
  }
};


// קבלת כל ההשוואות
exports.getAllComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.find();
    res.json(comparisons);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת השוואות', error: err });
  }
};


exports.getComparisonsForCopyById = async (req, res) => {
  const { copyId } = req.params;

  try {
    const comparisons = await Comparison.find({
      $or: [{ copyA: copyId }, { copyB: copyId }]
    });

    // מחזיר רק את המזהים של העתק השני
    const result = comparisons.map(c => (c.copyA.toString() === copyId ? c.copyB : c.copyA));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בקבלת השוואות', error: err });
  }
};


// בדיקה אם השוואה כבר קיימת
exports.checkComparisonExists = async (req, res) => {
  let { copyId1, copyId2 } = req.body;
  if (!copyId1 || !copyId2 || copyId1 === copyId2) {
    return res.status(400).json({ message: 'פרמטרים לא חוקיים' });
  }

  try {
    if (copyId1 > copyId2) [copyId1, copyId2] = [copyId2, copyId1];

    const exists = await Comparison.findOne({ copyA: copyId1, copyB: copyId2 });
    res.json({ exists: !!exists }); // מחזיר true או false
  } catch (err) {
    console.error('שגיאה בבדיקת השוואה:', err);
    res.status(500).json({ message: 'שגיאה בבדיקת השוואה', error: err });
  }
};
