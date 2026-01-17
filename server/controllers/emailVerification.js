// controllers/emailVerificationController.js
const EmailVerification = require("../models/EmailVerification");
const nodemailer = require("nodemailer");

// Helper: Create verification code Hash
function hashCode(code) {
  return EmailVerification.hashCode(code);
}

// Send verification code to email
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Please enter email" });

  try {
    // Generate random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // upsert - create or update by email
    await EmailVerification.findOneAndUpdate(
      { email },
      { codeHash, expiresAt, verified: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let emailSent = false;
    let lastError = null;

    // Try Brevo first (if API key is configured)
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
            to: [{ email }],
            subject: "Verification Code",
            htmlContent: `<p>Your verification code is: <strong>${code}</strong></p><p>The code is valid for 10 minutes.</p>`,
            textContent: `Your verification code is: ${code}\nThe code is valid for 10 minutes.`,
          }),
        });

        if (response.ok) {
          console.log("✅ Email sent via Brevo to:", email);
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
    }

    // Fallback to Gmail if Brevo failed or not configured
    if (!emailSent && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Verification Code",
          text: `Your verification code is: ${code}\nThe code is valid for 10 minutes.`,
        });

        console.log("✅ Email sent via Gmail (fallback) to:", email);
        emailSent = true;
      } catch (gmailErr) {
        console.error("❌ Gmail fallback also failed:", gmailErr.message);
        lastError = gmailErr;
      }
    }

    if (!emailSent) {
      console.error("❌ All email methods failed. Last error:", lastError);
      throw new Error("Failed to send email via any method");
    }

    res.json({ success: true, message: "Verification code sent to email" });
  } catch (err) {
    console.error("sendVerificationCode error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error sending verification code. Please try again later." });
  }
};

// Verify the code received by the user
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res
      .status(400)
      .json({ success: false, message: "Missing email or code" });

  try {
    const record = await EmailVerification.findOne({ email }).select(
      "+codeHash +expiresAt"
    );
    if (!record)
      return res
        .status(404)
        .json({ success: false, message: "Verification request not found" });

    if (record.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code has expired" });
    }

    if (hashCode(code) !== record.codeHash) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    // Success – delete the record from DB
    await EmailVerification.findByIdAndDelete(record._id);

    res.json({ success: true, message: "Verification successful!" });
  } catch (err) {
    console.error("verifyCode error:", err);
    res.status(500).json({ success: false, message: "Error verifying code" });
  }
};
