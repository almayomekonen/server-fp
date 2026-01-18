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

    // 🔴 Emit real-time event
    if (global.io) {
      console.log("🔴🔴🔴 [BACKEND] Emitting registrationRequestCreated");
      global.io.emit("registrationRequestCreated", { request: request.toObject() });
      console.log("✅ registrationRequestCreated event emitted successfully");
    }

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

    // Send email notification to the user
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: newUser.email,
        subject: "Account Approved - You Can Now Login",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1F4E78;">Account Approved!</h2>
            <p>Hello <strong>${newUser.username}</strong>,</p>
            <p>Great news! Your account has been approved by the administrator.</p>
            <p>You can now login using your credentials.</p>
            <p style="margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" 
                 style="background-color: #1F4E78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Login
              </a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you have any questions, please contact the administrator.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Approval email sent to:", newUser.email);
    } catch (emailErr) {
      console.error("⚠️ Failed to send approval email:", emailErr);
      // Don't fail the approval if email sending fails
    }

    // 🔴 Emit real-time events
    if (global.io) {
      console.log("🔴🔴🔴 [BACKEND] Emitting registrationRequestApproved and userCreated");
      global.io.emit("registrationRequestApproved", { requestId: id });
      global.io.emit("userCreated", { user: newUser.toObject() });
      console.log("✅ Events emitted successfully");
    }

    res.status(201).json({ message: "User approved and added", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

exports.rejectRegistrationRequest = async (req, res) => {
  const { id } = req.params;

  try {
    await RegistrationRequest.findByIdAndDelete(id);

    // 🔴 Emit real-time event
    if (global.io) {
      console.log("🔴🔴🔴 [BACKEND] Emitting registrationRequestRejected");
      global.io.emit("registrationRequestRejected", { requestId: id });
      console.log("✅ registrationRequestRejected event emitted successfully");
    }

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

exports.checkAvailability = async (req, res) => {
  const { username, email } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ message: "Username and email are required" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    const existingRequest = await RegistrationRequest.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser || existingRequest) {
      return res.status(200).json({
        available: false,
        message: "Username or email already exists or is pending approval.",
      });
    }

    res.status(200).json({ available: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};
