import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createQuiz,
  listQuizzesForSkill,
  getQuizWithQuestions,
  updateQuiz,
  deleteQuiz,
} from "../controllers/quizCrudController.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/skills/:skillId/quizzes",
  protect,
  authorize("admin"),
  createQuiz
);
router.get("/skills/:skillId/quizzes", protect, listQuizzesForSkill);
router.get("/quizzes/:quizId", protect, getQuizWithQuestions);
router.put("/quizzes/:quizId", protect, authorize("admin"), updateQuiz);
router.delete("/quizzes/:quizId", protect, authorize("admin"), deleteQuiz);

export default router;
