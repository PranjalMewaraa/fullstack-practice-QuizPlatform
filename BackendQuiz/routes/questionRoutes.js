import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  bulkDeleteQuestions,
  createQuestion,
  deleteQuestion,
  getQuestions,
  getQuestionsBySkill,
  updateQuestion,
} from "../controllers/questionController.js";

import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.post("/", protect, authorize("admin"), createQuestion);
router.get("/", protect, getQuestions);
router.get("/skill/:skillId", protect, getQuestionsBySkill);
router.put("/:id", protect, authorize("admin"), updateQuestion);
router.delete("/:id", protect, authorize("admin"), deleteQuestion);

// Optional bulk delete
router.delete("/", protect, authorize("admin"), bulkDeleteQuestions);
export default router;
