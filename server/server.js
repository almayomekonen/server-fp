const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const User = require("./models/User");
const Color = require("./models/Color");

const app = express();

app.use(helmet());

// Middlewares
app.use(express.json());
app.use(cookieParser());

// CORS Configuration - תיקון!
const allowedOrigins = [
  "http://localhost:3000",
  "https://client-fp-production.up.railway.app",
  process.env.CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean); // מסנן undefined

console.log("🔧 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // אפשר בקשות ללא origin (כמו Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        console.log(`✅ Allowed origin: ${origin}`);
        return callback(null, true);
      }

      console.log(`❌ Blocked origin: ${origin}`);
      return callback(new Error("CORS policy: origin not allowed"), false);
    },
    credentials: true,
  })
);

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
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
