//controllers/registration.js

const RegistrationRequest = require("../models/RegistrationRequest");
const User = require("../models/User");
const nodemailer = require("nodemailer");

exports.registerRequest = async (req, res) => {
  const { username, password, role, email } = req.body;
  if (!username || !password || !role || !email) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    const existingRequest = await RegistrationRequest.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser || existingRequest) {
      return res
        .status(400)
        .json({
          message: "Username or email already exists or is pending approval.",
        });
    }

    const request = new RegistrationRequest({ username, email, role });
    await request.setPassword(password);
    await request.save();

    res
      .status(201)
      .json({
        message: "Registration submitted. Please wait for admin approval.",
      });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

exports.approveRegistrationRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await RegistrationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const newUser = new User({
      username: request.username,
      email: request.email,
      role: request.role,
      passwordHash: request.passwordHash,
    });

    await newUser.save();
    await request.deleteOne();

    res.status(201).json({ message: "User approved and added", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

exports.rejectRegistrationRequest = async (req, res) => {
  const { id } = req.params;

  try {
    await RegistrationRequest.findByIdAndDelete(id);
    res.json({ message: "Request rejected and deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

exports.getAllRegistrationRequests = async (req, res) => {
  try {
    const requests = await RegistrationRequest.find().select("-passwordHash");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};
