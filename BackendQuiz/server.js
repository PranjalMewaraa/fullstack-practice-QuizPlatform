// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { sequelize } from "./config/db.js";

// Route imports
import quizCrudRoutes from "./routes/quizCrudRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import reportRoutes from "./routes/reportRoutes.js"; // ✅ corrected relative path

dotenv.config();

const app = express();

/* ✅ Global Middleware Setup */
app.use(
  cors({
    origin: "*", // allow all origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Optional debug logger for auth routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) {
    console.log(
      "AUTH DEBUG:",
      req.method,
      req.path,
      "Auth:",
      req.headers.authorization || "none"
    );
  }
  next();
});

/* ✅ Register all routes */
app.use("/api/reports", reportRoutes);
app.use("/api", quizCrudRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quiz", quizRoutes);

/* ✅ Database Sync & Server Start */
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => console.log("✅ Database connected successfully"))
  .then(() => sequelize.sync({ alter: false }))
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
