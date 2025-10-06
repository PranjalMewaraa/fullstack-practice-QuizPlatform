// controllers/skillController.js
import Skill from "../models/skillModel.js";
import Question from "../models/questionModel.js";
import { sequelize } from "../config/db.js";

export const createSkill = async (req, res) => {
  const skill = await Skill.create(req.body);
  res.json(skill);
};

export const getSkills = async (req, res) => {
  const skills = await Skill.findAll({ order: [["id", "ASC"]] });
  res.json(skills);
};

/**
 * PUT /api/skills/:id  (admin)
 * Body: { name?, description? }
 */
export const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await Skill.findByPk(id);
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    const { name, description } = req.body;

    // (Optional) prevent duplicate names
    if (name && name.trim() && name.trim() !== skill.name) {
      const exists = await Skill.count({ where: { name: name.trim() } });
      if (exists)
        return res.status(409).json({ message: "Skill name already exists" });
      skill.name = name.trim();
    }
    if (description !== undefined) skill.description = description;

    await skill.save();
    res.json(skill);
  } catch (err) {
    console.error("updateSkill error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/skills/:id  (admin)
 * Query: ?force=true to also delete all Questions under this skill
 */
export const deleteSkill = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const force = String(req.query.force || "false").toLowerCase() === "true";

    const skill = await Skill.findByPk(id, { transaction: t });
    if (!skill) {
      await t.rollback();
      return res.status(404).json({ message: "Skill not found" });
    }

    const qCount = await Question.count({
      where: { SkillId: id },
      transaction: t,
    });
    if (qCount > 0 && !force) {
      await t.rollback();
      return res.status(409).json({
        message:
          "Skill has linked questions. Pass ?force=true to delete skill and its questions.",
        questions: qCount,
      });
    }

    if (qCount > 0 && force) {
      await Question.destroy({ where: { SkillId: id }, transaction: t });
    }

    await skill.destroy({ transaction: t });
    await t.commit();
    res.json({
      message: "Skill deleted",
      id: Number(id),
      deletedQuestions: force ? qCount : 0,
    });
  } catch (err) {
    await t.rollback();
    console.error("deleteSkill error:", err);
    res.status(500).json({ message: err.message });
  }
};
