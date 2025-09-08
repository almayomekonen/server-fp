//controllers/registration.js

const RegistrationRequest = require('../models/RegistrationRequest');
const User = require('../models/User');
const nodemailer = require('nodemailer');


exports.registerRequest = async (req, res) => {
  const { username, password, role, email } = req.body;
  if (!username || !password  || !role || !email) {
    return res.status(400).json({ message: 'נא למלא את כל השדות' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    const existingRequest = await RegistrationRequest.findOne({ $or: [{ username }, { email }] });

    if (existingUser || existingRequest) {
      return res.status(400).json({ message: 'שם המשתמש או המייל כבר קיים או ממתין לאישור.' });
    }

    const request = new RegistrationRequest({ username, email, role });
    await request.setPassword(password); // ✅ מצפין סיסמא
    await request.save();

    res.status(201).json({ message: 'ההרשמה נשלחה. המתן לאישור המנהל.' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשרת', err });
  }
};



exports.approveRegistrationRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await RegistrationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'הבקשה לא נמצאה' });
    }

    const newUser = new User({
      username: request.username,
      email: request.email,
      role: request.role,
      passwordHash: request.passwordHash, // ✅ שומר hash שכבר קיים
    });

    await newUser.save();
    await request.deleteOne();

    res.status(201).json({ message: 'המשתמש אושר ונוסף', user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשרת', err });
  }
};


exports.rejectRegistrationRequest = async (req, res) => {
  const { id } = req.params;

  try {
    await RegistrationRequest.findByIdAndDelete(id);
    res.json({ message: 'הבקשה נדחתה ונמחקה' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשרת', err });
  }
};


exports.getAllRegistrationRequests = async (req, res) => {
  try {
    const requests = await RegistrationRequest.find().select("-passwordHash"); 
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשרת', err });
  }
};




