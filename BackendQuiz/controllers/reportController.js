// controllers/reportController.js
import { Op, fn, col, literal, QueryTypes, Sequelize } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "../models/userModel.js";
import Skill from "../models/skillModel.js";
import Question from "../models/questionModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import QuizAnswer from "../models/quizAnswerModel.js";

/**
 * GET /api/reports/user/:userId
 * Overall performance for a single user: attempts, avg score, last attempt, per-skill accuracy summary
 */
export const userOverview = async (req, res) => {
  try {
    const { userId } = req.params;

    // Attempts & averages
    const attempts = await QuizAttempt.findAll({
      where: { UserId: userId },
      attributes: ["id", "total_score", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    const totalAttempts = attempts.length;
    const avgScore =
      totalAttempts === 0
        ? 0
        : attempts.reduce((s, a) => s + (a.total_score || 0), 0) /
          totalAttempts;

    // Per-skill accuracy (correct / total)
    const perSkill = await QuizAnswer.findAll({
      include: [
        {
          model: QuizAttempt,
          attributes: [],
          where: { UserId: userId },
        },
        {
          model: Question,
          attributes: [],
          include: [{ model: Skill, attributes: [] }],
        },
      ],
      attributes: [
        [fn("COUNT", col("QuizAnswer.id")), "total"],
        [fn("SUM", fn("IF", col("QuizAnswer.is_correct"), 1, 0)), "correct"],
        [col("Question->Skill.name"), "skillName"],
      ],
      group: ["Question->Skill.id"],
      raw: true,
    });

    const skills = perSkill.map((r) => ({
      skill: r.skillName,
      total: Number(r.total || 0),
      correct: Number(r.correct || 0),
      accuracy:
        Number(r.total || 0) === 0
          ? 0
          : Number(((r.correct / r.total) * 100).toFixed(2)),
    }));

    res.json({
      userId: Number(userId),
      totalAttempts,
      avgScore: Number(avgScore.toFixed(2)),
      lastAttemptAt: attempts[0]?.createdAt ?? null,
      skills,
    });
  } catch (e) {
    console.error("userOverview error:", e);
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/reports/user/:userId/skills
 * Detailed per-skill accuracy for a user (with optional threshold)
 * Query: ?minAttempts=3
 */
export const userSkillAccuracy = async (req, res) => {
  try {
    const { userId } = req.params;
    const minAttempts = Number(req.query.minAttempts || 0);

    const rows = await QuizAnswer.findAll({
      include: [
        {
          model: QuizAttempt,
          attributes: [],
          where: { UserId: userId },
        },
        {
          model: Question,
          attributes: [],
          include: [{ model: Skill, attributes: [] }],
        },
      ],
      attributes: [
        [col("Question->Skill.id"), "skillId"],
        [col("Question->Skill.name"), "skillName"],
        [fn("COUNT", col("QuizAnswer.id")), "total"],
        [fn("SUM", fn("IF", col("QuizAnswer.is_correct"), 1, 0)), "correct"],
      ],
      group: ["Question->Skill.id"],
      raw: true,
    });

    const data = rows
      .map((r) => ({
        skillId: Number(r.skillId),
        skill: r.skillName,
        total: Number(r.total || 0),
        correct: Number(r.correct || 0),
        accuracy:
          Number(r.total || 0) === 0
            ? 0
            : Number(((r.correct / r.total) * 100).toFixed(2)),
      }))
      .filter((r) => r.total >= minAttempts);

    res.json({ userId: Number(userId), minAttempts, skills: data });
  } catch (e) {
    console.error("userSkillAccuracy error:", e);
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/reports/time
 * Time-based trend. Query:
 *  - period=week|month (defaults month) OR start=YYYY-MM-DD&end=YYYY-MM-DD
 *  - groupBy=day|week (default day)
 */
export const timeTrend = async (req, res) => {
  try {
    const { period, start, end, groupBy, skillId } = req.query;

    let startDate;
    let endDate = new Date();

    if (start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
    } else if (period === "week") {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // default month (30 days)
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const fmt = groupBy === "week" ? "%x-%v" : "%Y-%m-%d";

    // ---- Main time buckets (attempts + avgScore) ----
    const rows = await sequelize.query(
      `
      SELECT DATE_FORMAT(qa.createdAt, :fmt) AS bucket,
             COUNT(*) AS attempts,
             AVG(qa.total_score) AS avgScore
      FROM QuizAttempts qa
      ${
        skillId
          ? `
        WHERE qa.createdAt BETWEEN :start AND :end
          AND EXISTS (
            SELECT 1
            FROM QuizAnswers a
            JOIN Questions q ON q.id = a.QuestionId
            WHERE a.QuizAttemptId = qa.id
              AND q.SkillId = :skillId
          )`
          : `
        WHERE qa.createdAt BETWEEN :start AND :end
      `
      }
      GROUP BY bucket
      ORDER BY bucket ASC;
      `,
      {
        replacements: { fmt, start: startDate, end: endDate, skillId },
        type: QueryTypes.SELECT,
      }
    );

    // ---- Extra: distinct users who attempted (per skill) in the window ----
    let skillsUsers = null;
    let usersAttemptedForSkill = null;

    if (skillId) {
      // Single skill: distinct users in range who have at least one answer on that skill
      const [one] = await sequelize.query(
        `
        SELECT COUNT(DISTINCT att.UserId) AS users
        FROM QuizAttempts att
        JOIN QuizAnswers a ON a.QuizAttemptId = att.id
        JOIN Questions q ON q.id = a.QuestionId
        WHERE att.createdAt BETWEEN :start AND :end
          AND q.SkillId = :skillId;
        `,
        {
          replacements: { start: startDate, end: endDate, skillId },
          type: QueryTypes.SELECT,
        }
      );
      usersAttemptedForSkill = Number(one?.users || 0);
    } else {
      // All skills: distinct users per skill in range
      const rowsUsers = await sequelize.query(
        `
        SELECT 
          s.id AS skillId,
          s.name AS skillName,
          COUNT(DISTINCT att.UserId) AS users
        FROM QuizAttempts att
        JOIN QuizAnswers a ON a.QuizAttemptId = att.id
        JOIN Questions q ON q.id = a.QuestionId
        JOIN Skills s ON s.id = q.SkillId
        WHERE att.createdAt BETWEEN :start AND :end
        GROUP BY s.id
        ORDER BY users DESC, s.name ASC;
        `,
        {
          replacements: { start: startDate, end: endDate },
          type: QueryTypes.SELECT,
        }
      );

      skillsUsers = rowsUsers.map((r) => ({
        skillId: Number(r.skillId),
        skill: r.skillName,
        users: Number(r.users || 0),
      }));
    }

    res.json({
      start: startDate,
      end: endDate,
      groupBy: groupBy === "week" ? "week" : "day",
      skillId: skillId ? Number(skillId) : null,
      points: rows.map((r) => ({
        bucket: r.bucket,
        attempts: Number(r.attempts),
        avgScore: Number(Number(r.avgScore || 0).toFixed(2)),
      })),
      // new fields:
      usersAttemptedForSkill, // number | null (when skillId provided)
      skillsUsers, // array | null (when skillId not provided)
    });
  } catch (e) {
    console.error("timeTrend error:", e);
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/reports/group
 * Paginated user leaderboard/overview
 * Query: ?page=1&limit=10&orderBy=avgScore|attempts&dir=DESC|ASC
 */
export const groupOverview = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;
    const orderBy = ["avgScore", "attempts"].includes(req.query.orderBy)
      ? req.query.orderBy
      : "avgScore";
    const dir = req.query.dir === "ASC" ? "ASC" : "DESC";

    // Per-user aggregates + correlated subqueries for best/weakest skills
    const rows = await sequelize.query(
      `
      SELECT 
        u.id AS userId, u.name, u.email,
        COUNT(qa.id) AS attempts,
        AVG(qa.total_score) AS avgScore,
        MAX(qa.createdAt) AS lastAttemptAt,
        /* how many distinct skills user has answered */
        (
          SELECT COUNT(DISTINCT q2.SkillId)
          FROM QuizAnswers qa2
          JOIN QuizAttempts att2 ON att2.id = qa2.QuizAttemptId AND att2.UserId = u.id
          JOIN Questions q2 ON q2.id = qa2.QuestionId
        ) AS skillsCovered,
        /* best skill name */
        (
          SELECT s1.name
          FROM QuizAnswers qa3
          JOIN QuizAttempts att3 ON att3.id = qa3.QuizAttemptId AND att3.UserId = u.id
          JOIN Questions q3 ON q3.id = qa3.QuestionId
          JOIN Skills s1 ON s1.id = q3.SkillId
          GROUP BY s1.id
          ORDER BY SUM(CASE WHEN qa3.is_correct = 1 THEN 1 ELSE 0 END)/COUNT(*) DESC
          LIMIT 1
        ) AS bestSkillName,
        /* best skill accuracy */
        (
          SELECT ROUND(100 * SUM(CASE WHEN qa3.is_correct = 1 THEN 1 ELSE 0 END)/COUNT(*), 2)
          FROM QuizAnswers qa3
          JOIN QuizAttempts att3 ON att3.id = qa3.QuizAttemptId AND att3.UserId = u.id
          JOIN Questions q3 ON q3.id = qa3.QuestionId
          JOIN Skills s1 ON s1.id = q3.SkillId
          GROUP BY s1.id
          ORDER BY SUM(CASE WHEN qa3.is_correct = 1 THEN 1 ELSE 0 END)/COUNT(*) DESC
          LIMIT 1
        ) AS bestSkillAcc,
        /* weakest skill name */
        (
          SELECT s2.name
          FROM QuizAnswers qa4
          JOIN QuizAttempts att4 ON att4.id = qa4.QuizAttemptId AND att4.UserId = u.id
          JOIN Questions q4 ON q4.id = qa4.QuestionId
          JOIN Skills s2 ON s2.id = q4.SkillId
          GROUP BY s2.id
          ORDER BY SUM(CASE WHEN qa4.is_correct = 1 THEN 1 ELSE 0 END)/COUNT(*) ASC
          LIMIT 1
        ) AS weakestSkillName,
        /* weakest skill accuracy */
        (
          SELECT ROUND(100 * SUM(CASE WHEN qa4.is_correct = 1 THEN 1 ELSE 0 END)/COUNT(*), 2)
          FROM QuizAnswers qa4
          JOIN QuizAttempts att4 ON att4.id = qa4.QuizAttemptId AND att4.UserId = u.id
          JOIN Questions q4 ON q4.id = qa4.QuestionId
          JOIN Skills s2 ON s2.id = q4.SkillId
          GROUP BY s2.id
          ORDER BY SUM(CASE WHEN qa4.is_correct = 1 THEN 1 ELSE 0 END)/COUNT(*) ASC
          LIMIT 1
        ) AS weakestSkillAcc
      FROM Users u
      LEFT JOIN QuizAttempts qa ON qa.UserId = u.id
      GROUP BY u.id
      ORDER BY ${orderBy === "attempts" ? "attempts" : "avgScore"} ${dir}
      LIMIT :limit OFFSET :offset;
      `,
      { replacements: { limit, offset }, type: QueryTypes.SELECT }
    );

    res.json({
      page,
      limit,
      items: rows.map((r) => ({
        userId: Number(r.userId),
        name: r.name,
        email: r.email,
        attempts: Number(r.attempts || 0),
        avgScore:
          r.avgScore == null ? 0 : Number(Number(r.avgScore).toFixed(2)),
        lastAttemptAt: r.lastAttemptAt,
        skillsCovered: Number(r.skillsCovered || 0),
        bestSkillName: r.bestSkillName || null,
        bestSkillAcc: r.bestSkillAcc == null ? null : Number(r.bestSkillAcc),
        weakestSkillName: r.weakestSkillName || null,
        weakestSkillAcc:
          r.weakestSkillAcc == null ? null : Number(r.weakestSkillAcc),
      })),
    });
  } catch (e) {
    console.error("groupOverview extended error:", e);
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/reports/skill/:skillId/leaderboard
 * Who performs best on a single skill (accuracy)
 * Query: ?minAnswers=3&limit=20
 */
export const skillLeaderboard = async (req, res) => {
  try {
    const { skillId } = req.params;
    const minAnswers = Number(req.query.minAnswers || 3);
    const limit = Number(req.query.limit || 20);

    const rows = await sequelize.query(
      `
      SELECT u.id AS userId, u.name, u.email,
             SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
             COUNT(qa.id) AS total
      FROM QuizAnswers qa
      JOIN QuizAttempts att ON att.id = qa.QuizAttemptId
      JOIN Users u ON u.id = att.UserId
      JOIN Questions q ON q.id = qa.QuestionId
      WHERE q.SkillId = :skillId
      GROUP BY u.id
      HAVING total >= :minAnswers
      ORDER BY (correct / total) DESC
      LIMIT :limit;
      `,
      {
        replacements: { skillId, minAnswers, limit },
        type: QueryTypes.SELECT,
      }
    );

    res.json(
      rows.map((r) => ({
        userId: Number(r.userId),
        name: r.name,
        email: r.email,
        total: Number(r.total),
        correct: Number(r.correct),
        accuracy: Number(((r.correct / r.total) * 100).toFixed(2)),
      }))
    );
  } catch (e) {
    console.error("skillLeaderboard error:", e);
    res.status(500).json({ message: e.message });
  }
};
// Average accuracy per skill across all users (admin-level skill gaps)
// GET /api/reports/skills/gaps?minAnswers=5&limit=100
export const groupSkillGaps = async (req, res) => {
  try {
    const minAnswers = Number(req.query.minAnswers || 5);
    const limit = Number(req.query.limit || 100);

    const rows = await sequelize.query(
      `
      SELECT 
        s.id AS skillId,
        s.name AS skillName,
        SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
        COUNT(qa.id) AS total,
        COUNT(DISTINCT att.UserId) AS users,
        MAX(att.createdAt) AS lastActivity
      FROM QuizAnswers qa
      JOIN QuizAttempts att ON att.id = qa.QuizAttemptId
      JOIN Questions q ON q.id = qa.QuestionId
      JOIN Skills s ON s.id = q.SkillId
      GROUP BY s.id
      HAVING total >= :minAnswers
      ORDER BY (correct / total) ASC
      LIMIT :limit;
      `,
      { replacements: { minAnswers, limit }, type: QueryTypes.SELECT }
    );

    res.json(
      rows.map((r) => ({
        skillId: Number(r.skillId),
        skill: r.skillName,
        total: Number(r.total),
        correct: Number(r.correct),
        avgAccuracy: Number(((r.correct / r.total) * 100).toFixed(2)),
        users: Number(r.users || 0),
        lastActivity: r.lastActivity,
      }))
    );
  } catch (e) {
    console.error("groupSkillGaps error:", e);
    res.status(500).json({ message: e.message });
  }
};
