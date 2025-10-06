import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin"), getAllUsers);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
