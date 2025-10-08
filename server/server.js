const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const User = require("./models/User");
const Color = require("./models/Color");

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_ORIGIN,
  process.env.RAILWAY_STATIC_URL,
  process.env.FRONTEND_URL,
  "https://client-fp-production.up.railway.app",
  "https://*.up.railway.app",
].filter(Boolean);

console.log("Allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request from origin:", origin);
      if (!origin) return callback(null, true);

      // בדוק אם הכתובת מתאימה לאחד מה-origins המותרים
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin.includes("*")) {
          const pattern = allowedOrigin.replace("*", ".*");
          return new RegExp(pattern).test(origin);
        }
        return allowedOrigin === origin;
      });

      if (!isAllowed) {
        console.log("CORS blocked origin:", origin);
        return callback(new Error("CORS policy: origin not allowed"), false);
      }
      return callback(null, true);
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
console.log("🔍 Environment check:");
console.log("MONGO_URL:", process.env.MONGO_URL);
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("NODE_ENV:", process.env.NODE_ENV);

mongoose
  .connect(process.env.MONGO_URL || process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    const admin = await User.findOne({ username: "ADMIN" });
    if (!admin) {
      const defaultAdmin = new User({
        username: "ADMIN",
        role: "admin",
        email: "finalprojecthadas@gmail.com",
      });
      await defaultAdmin.setPassword("123");
      await defaultAdmin.save();
      console.log("Created default ADMIN");
    }

    const defaultColors = [
      { name: "yellow", code: "#FFFF00" },
      { name: "green", code: "#00FF00" },
    ];

    for (const color of defaultColors) {
      const exists = await Color.findOne({ name: color.name });
      if (!exists) {
        await Color.create(color);
      }
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Hello from Node.js backend!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
