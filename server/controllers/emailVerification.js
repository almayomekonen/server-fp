// controllers/emailVerificationController.js
const EmailVerification = require('../models/EmailVerification');
const nodemailer = require('nodemailer');

// עוזר: יצירת קוד אימות Hash
function hashCode(code) {
  return EmailVerification.hashCode(code);
}

// שליחת קוד אימות למייל
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'נא להזין אימייל' });

  try {
    // יצירת קוד אקראי
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // תוקף 10 דקות

    // upsert - יוצרים או מעדכנים לפי email
    await EmailVerification.findOneAndUpdate(
      { email },
      { codeHash, expiresAt, verified: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // שליחת המייל
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'קוד אימות',
      text: `קוד האימות שלך הוא: ${code}`
    });

    res.json({ success: true, message: 'קוד אימות נשלח למייל' });
  } catch (err) {
    console.error('sendVerificationCode error:', err);
    res.status(500).json({ success: false, message: 'שגיאה בשליחת קוד האימות' });
  }
};

// אימות הקוד שהמשתמש קיבל
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ success: false, message: 'חסר אימייל או קוד' });

  try {
    const record = await EmailVerification.findOne({ email }).select('+codeHash +expiresAt');
    if (!record) return res.status(404).json({ success: false, message: 'לא נמצאה בקשת אימות' });

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'קוד האימות פג תוקף' });
    }

    if (hashCode(code) !== record.codeHash) {
      return res.status(400).json({ success: false, message: 'קוד אימות שגוי' });
    }

// הצלחה – מוחקים את הרשומה מה-DB
await EmailVerification.findByIdAndDelete(record._id);


    res.json({ success: true, message: 'האימות הצליח!' });
  } catch (err) {
    console.error('verifyCode error:', err);
    res.status(500).json({ success: false, message: 'שגיאה באימות הקוד' });
  }
};
