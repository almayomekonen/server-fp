const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

console.log("APP STARTED");

const User = require("./models/User");
const Color = require("./models/Color");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

// Middlewares
app.use(express.json());
app.use(cookieParser());

// CORS Configuration - תיקון מלא!
const allowedOrigins = [
  "http://localhost:3000",
  "https://client-fp-production.up.railway.app",
].filter(Boolean);

console.log("🔧 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: origin not allowed"), false);
    },
    credentials: true, // ← חשוב!
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ← הוסף
    allowedHeaders: ["Content-Type", "Authorization"], // ← הוסף
  })
);

app.get("/api/admin/cleanup-orphans", async (req, res) => {
  try {
    const Copy = require("./models/Copy");
    const Statement = require("./models/Statement");
    const Experiment = require("./models/Experiment");

    const allCopies = await Copy.find({}).lean();
    const orphanedIds = [];
    const details = [];

    for (const copy of allCopies) {
      const statement = await Statement.findById(copy.statementId);
      const experiment = await Experiment.findById(copy.experimentId);

      if (!statement || !experiment) {
        orphanedIds.push(copy._id);
        details.push({
          copyId: copy._id,
          statementExists: !!statement,
          experimentExists: !!experiment,
          statementId: copy.statementId,
          experimentId: copy.experimentId,
        });
      }
    }

    if (orphanedIds.length === 0) {
      return res.json({
        success: true,
        message: "No orphaned copies found!",
        deletedCount: 0,
      });
    }

    const result = await Copy.deleteMany({ _id: { $in: orphanedIds } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} orphaned copies`,
      deletedCount: result.deletedCount,
      details,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use("/api/registration", require("./routes/registration"));
app.use("/api/users", require("./routes/user"));
app.use("/api/experiments", require("./routes/experiment"));
app.use("/api/groups", require("./routes/group"));
app.use("/api/statements", require("./routes/statement"));
app.use("/api/copies", require("./routes/copy"));
app.use("/api/tasks", require("./routes/task"));
app.use("/api/comments", require("./routes/comment"));
app.use("/api/copyMessages", require("./routes/copyMessage"));
app.use("/api/taskMessages", require("./routes/taskMessage"));
app.use("/api/colors", require("./routes/color"));
app.use("/api/styles", require("./routes/styleSetting"));
app.use("/api/comparisons", require("./routes/comparison"));
app.use("/api/email-verification", require("./routes/emailVerification"));
app.use("/api/auth", require("./routes/auth"));

// MongoDB
const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const admin = await User.findOne({ username: "ADMIN" });
    if (!admin) {
      const defaultAdmin = new User({
        username: "ADMIN",
        role: "admin",
        email: "finalprojecthadas@gmail.com",
      });
      await defaultAdmin.setPassword("123");
      await defaultAdmin.save();
      console.log("🎉 Created default ADMIN with password 123");
    } else {
      console.log("ℹ️ ADMIN user already exists");
    }

    const defaultColors = [
      { name: "yellow", code: "#FFFF00" },
      { name: "green", code: "#00FF00" },
    ];

    for (const color of defaultColors) {
      const exists = await Color.findOne({ name: color.name });
      if (!exists) {
        await Color.create(color);
        console.log(`🎨 Added default color: ${color.name}`);
      }
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Hello from Node.js backend!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
