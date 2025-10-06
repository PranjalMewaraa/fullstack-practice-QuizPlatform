// routes/authRoutes.js
import express from "express";
import { register, login } from "../controllers/authController.js";
const router = express.Router();

router.get("/ping", (req, res) => res.json({ ok: true })); // <-- add this

router.post("/register", register);
router.post("/login", login);

export default router;
