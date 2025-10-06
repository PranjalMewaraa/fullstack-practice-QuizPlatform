import { Op } from "sequelize";
import { sequelize } from "../config/db.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import QuizAnswer from "../models/quizAnswerModel.js";
import Question from "../models/questionModel.js";

// POST /api/quiz/start
// Body: { userId, answers: [{questionId, selected_option}], durationMs? }
export const startQuiz = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId, answers = [], durationMs = 0 } = req.body;

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!Array.isArray(answers) || answers.length === 0) {
      return res
        .status(400)
        .json({ message: "answers must be a non-empty array" });
    }

    // Normalize & dedupe questionIds while preserving first selection for duplicates
    const seen = new Set();
    const normalized = [];
    for (const a of answers) {
      const qid = Number(a.questionId);
      if (!qid || seen.has(qid)) continue;
      seen.add(qid);
      normalized.push({
        questionId: qid,
        selected_option: String(a.selected_option ?? ""),
      });
    }

    const questionIds = normalized.map((a) => a.questionId);

    // Load all questions in one go (include points with default 1)
    const qs = await Question.findAll({
      where: { id: { [Op.in]: questionIds } },
      transaction: t,
    });

    if (qs.length !== questionIds.length) {
      const foundSet = new Set(qs.map((q) => q.id));
      const missing = questionIds.filter((id) => !foundSet.has(id));
      return res.status(400).json({
        message: "Some questions were not found",
        missing,
      });
    }

    // Build a map for quick lookup
    const qMap = new Map(qs.map((q) => [q.id, q]));
    let totalEarned = 0;
    let maxScore = 0;

    // Tally & prepare QuizAnswer rows
    const answerRows = normalized.map((a) => {
      const q = qMap.get(a.questionId);
      const points = Number(q.points ?? 1); // default to 1 if column exists, else treat as 1
      const isCorrect = a.selected_option === q.correct_answer;
      const points_earned = isCorrect ? points : 0;

      totalEarned += points_earned;
      maxScore += points;

      return {
        selected_option: a.selected_option,
        is_correct: isCorrect,
        points_earned, // requires column; otherwise safe to omit
        QuestionId: q.id,
        // QuizAttemptId filled after attempt is created
      };
    });

    // Create attempt
    const attempt = await QuizAttempt.create(
      {
        UserId: userId,
        total_score: totalEarned,
        max_score: maxScore, // requires column; otherwise safe to omit
        num_questions: normalized.length, // requires column; otherwise safe to omit
        duration_ms: Number(durationMs) || 0, // requires column; otherwise safe to omit
      },
      { transaction: t }
    );

    // Attach attempt id and bulk insert answers
    answerRows.forEach((r) => (r.QuizAttemptId = attempt.id));
    await QuizAnswer.bulkCreate(answerRows, { transaction: t });

    await t.commit();

    // Useful response to show on UI
    res.json({
      message: "Quiz submitted",
      attemptId: attempt.id,
      score: totalEarned,
      maxScore,
      percent: maxScore
        ? Number(((totalEarned / maxScore) * 100).toFixed(2))
        : 0,
      numQuestions: normalized.length,
      correct: answerRows.filter((a) => a.is_correct).length,
    });
  } catch (err) {
    await t.rollback();
    console.error("startQuiz error:", err);
    res.status(500).json({ message: err.message });
  }
};
