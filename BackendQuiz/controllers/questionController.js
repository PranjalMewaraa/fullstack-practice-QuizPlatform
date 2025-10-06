import { Op } from "sequelize";
import { sequelize } from "../config/db.js";
import Question from "../models/questionModel.js";
import Skill from "../models/skillModel.js";

export const createQuestion = async (req, res) => {
  const question = await Question.create(req.body);
  res.json(question);
};

// GET /api/questions?page=1&limit=10&sort=createdAt&dir=DESC
export const getQuestions = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    const sortField = req.query.sort || "createdAt";
    const sortDir = req.query.dir?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // NEW: filters
    const where = {};
    const skillId = req.query.skillId;
    const q = (req.query.q || "").trim();

    if (skillId) where.SkillId = Number(skillId); // <— filter by skill
    if (q) where.question_text = { [Op.like]: `%${q}%` }; // <— optional search

    const { count, rows } = await Question.findAndCountAll({
      where,
      offset,
      limit,
      order: [[sortField, sortDir]],
      include: [{ model: Skill, attributes: ["id", "name"] }], // <— handy on UI
    });

    res.json({
      page,
      pageSize: limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      items: rows,
    });
  } catch (err) {
    console.error("getQuestions error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getQuestionsBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const shuffle =
      String(req.query.shuffle || "false").toLowerCase() === "true";

    const offset = (page - 1) * limit;

    // Hide the correct answers for regular users
    const attributes =
      req.user?.role === "admin" ? undefined : { exclude: ["correct_answer"] };

    const { rows, count } = await Question.findAndCountAll({
      where: { SkillId: skillId },
      attributes,
      offset,
      limit,
      order: shuffle ? sequelize.random() : [["createdAt", "DESC"]],
    });

    res.json({
      skillId: Number(skillId),
      page,
      pageSize: limit,
      total: count,
      items: rows,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await Question.findByPk(id);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const { question_text, options, correct_answer, SkillId } = req.body;

    // Validate options if provided
    if (options) {
      if (!Array.isArray(options))
        return res.status(400).json({ message: "`options` must be an array" });
      if (options.length < 2 || options.length > 6)
        return res
          .status(400)
          .json({ message: "Options must be between 2 and 6" });
      if (options.some((o) => !String(o || "").trim()))
        return res
          .status(400)
          .json({ message: "All options must be non-empty" });
      // no duplicates
      const trimmed = options.map((o) => String(o).trim());
      if (new Set(trimmed).size !== trimmed.length)
        return res
          .status(400)
          .json({ message: "Options must be unique (no duplicates)" });
    }

    // Validate correct_answer if provided or if options changed
    if (correct_answer || options) {
      const opts = options || q.options;
      const answer = (correct_answer ?? q.correct_answer) || "";
      if (!opts.includes(answer)) {
        return res.status(400).json({
          message: "correct_answer must be one of the options",
        });
      }
    }

    // Apply updates
    if (question_text !== undefined) q.question_text = question_text;
    if (options !== undefined) q.options = options;
    if (correct_answer !== undefined) q.correct_answer = correct_answer;
    if (SkillId !== undefined) q.SkillId = SkillId;

    await q.save();
    res.json(q);
  } catch (err) {
    console.error("updateQuestion error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/questions/:id  (admin)
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await Question.findByPk(id);
    if (!q) return res.status(404).json({ message: "Question not found" });

    await q.destroy();
    res.json({ message: "Question deleted", id: Number(id) });
  } catch (err) {
    console.error("deleteQuestion error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * (Optional) Bulk delete
 * DELETE /api/questions  (admin)
 * Body: { ids: [1,2,3] }
 */
export const bulkDeleteQuestions = async (req, res) => {
  try {
    const ids = req.body?.ids || [];
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "Provide ids: number[]" });

    const count = await Question.destroy({ where: { id: ids } });
    res.json({ message: "Questions deleted", count, ids });
  } catch (err) {
    console.error("bulkDeleteQuestions error:", err);
    res.status(500).json({ message: err.message });
  }
};
