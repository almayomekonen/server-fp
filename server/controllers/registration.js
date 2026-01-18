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
    let emailSent = false;
    let lastError = null;

    const emailSubject = "Account Approved - You Can Now Login";
    const emailHtml = `
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
    `;
    const emailText = `Hello ${newUser.username},\n\nGreat news! Your account has been approved by the administrator.\n\nYou can now login using your credentials at: ${process.env.CLIENT_URL || 'http://localhost:3000'}\n\nIf you have any questions, please contact the administrator.`;

    // Try Brevo first (recommended for production, works on Railway)
    if (process.env.BREVO_API_KEY) {
      try {
        const brevoUrl = "https://api.brevo.com/v3/smtp/email";
        const response = await fetch(brevoUrl, {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: "Deception Detection",
              email: process.env.EMAIL_USER || "noreply@example.com",
            },
            to: [{ email: newUser.email }],
            subject: emailSubject,
            htmlContent: emailHtml,
            textContent: emailText,
          }),
        });

        if (response.ok) {
          console.log("✅ Approval email sent via Brevo to:", newUser.email);
          emailSent = true;
        } else {
          const errorData = await response.json();
          console.error("❌ Brevo API error:", errorData);
          lastError = errorData;
          
          // Check if it's an IP restriction error
          if (errorData.code === 'unauthorized' || errorData.message?.includes('IP')) {
            console.warn("⚠️ Brevo IP restriction detected. Falling back to Gmail...");
          }
        }
      } catch (brevoErr) {
        console.error("❌ Brevo request failed:", brevoErr.message);
        lastError = brevoErr;
      }
    } else {
      console.warn("⚠️ BREVO_API_KEY not configured. Skipping Brevo email method.");
    }

    // Fallback to Gmail SMTP (only works locally, fails on Railway)
    if (!emailSent && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Skip Gmail fallback in production (Railway blocks SMTP)
      if (process.env.NODE_ENV === 'production') {
        console.warn("⚠️ Gmail SMTP fallback disabled in production (Railway blocks SMTP connections)");
      } else {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: newUser.email,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
          });

          console.log("✅ Approval email sent via Gmail (fallback) to:", newUser.email);
          emailSent = true;
        } catch (gmailErr) {
          console.error("❌ Gmail fallback also failed:", gmailErr.message);
          lastError = gmailErr;
        }
      }
    }

    if (!emailSent) {
      console.error("❌ All email methods failed. Last error:", lastError);
      console.error("⚠️ User was approved but email notification was not sent to:", newUser.email);
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
