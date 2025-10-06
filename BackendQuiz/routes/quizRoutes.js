import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { startQuiz } from "../controllers/quizController.js";
import {
  getAttemptsByUserId,
  submitQuiz,
} from "../controllers/quizAttemptController.js";

const router = express.Router();
router.post("/start", protect, startQuiz);
router.post("/submit", protect, submitQuiz);
router.get("/attempts/:userId", getAttemptsByUserId);
export default router;
