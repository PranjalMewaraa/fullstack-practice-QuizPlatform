// routes/skillRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill,
} from "../controllers/skillController.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, getSkills);
router.post("/", protect, authorize("admin"), createSkill);
router.put("/:id", protect, authorize("admin"), updateSkill);
router.delete("/:id", protect, authorize("admin"), deleteSkill);

export default router;
