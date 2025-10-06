import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { sequelize } from "./config/db.js";
import quizCrudRoutes from "./routes/quizCrudRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import reportRoutes from "../BackendQuiz/routes/reportRoutes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// server.js (put BEFORE app.use("/api/auth", authRoutes))
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

app.use("/api/reports", reportRoutes);
app.use("/api", quizCrudRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quiz", quizRoutes);

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log("✅ MySQL connected & models synced");
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
