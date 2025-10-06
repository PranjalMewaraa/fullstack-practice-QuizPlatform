// routes/reportRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  userOverview,
  userSkillAccuracy,
  timeTrend,
  groupOverview,
  skillLeaderboard,
  groupSkillGaps,
} from "../controllers/reportController.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// User can view their own reports; admins can view anyone's
router.get("/user/:userId", protect, userOverview);
router.get("/user/:userId/skills", protect, userSkillAccuracy);
router.get("/skills/gaps", protect, authorize("admin"), groupSkillGaps);

// Admin-only broader reports
router.get("/time", protect, authorize("admin"), timeTrend);
router.get("/group", protect, authorize("admin"), groupOverview);
router.get(
  "/skill/:skillId/leaderboard",
  protect,
  authorize("admin"),
  skillLeaderboard
);

export default router;
