import { sequelize } from "../config/db.js";
import Quiz from "../models/quizModel.js";
import Question from "../models/questionModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import QuizAnswer from "../models/quizAnswerModel.js";

export const submitQuiz = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId, quizId, answers = [], durationMs = 0 } = req.body;
    if (!userId || !quizId)
      return res.status(400).json({ message: "userId & quizId are required" });
    if (!Array.isArray(answers) || answers.length === 0)
      return res.status(400).json({ message: "answers must be provided" });

    const quiz = await Quiz.findByPk(quizId, { transaction: t });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const quizQuestions = await Question.findAll({
      where: { QuizId: quizId },
      transaction: t,
    });
    if (!quizQuestions.length)
      return res.status(400).json({ message: "Quiz has no questions" });

    const map = new Map(
      answers.map((a) => [
        Number(a.questionId),
        String(a.selected_option ?? ""),
      ])
    );
    const missing = quizQuestions
      .filter((q) => !map.has(q.id))
      .map((q) => q.id);
    if (missing.length)
      return res.status(400).json({ message: "Answer all questions", missing });

    let total = 0,
      max = 0;
    const rows = [];
    for (const q of quizQuestions) {
      const sel = map.get(q.id);
      const ok = sel === q.correct_answer;
      const pts = Number(q.points ?? 1);
      const earn = ok ? pts : 0;
      total += earn;
      max += pts;
      rows.push({
        QuestionId: q.id,
        selected_option: sel,
        is_correct: ok,
        points_earned: earn,
      });
    }

    const attempt = await QuizAttempt.create(
      {
        UserId: userId,
        QuizId: quizId,
        total_score: total,
        max_score: max,
        num_questions: quizQuestions.length,
        duration_ms: Number(durationMs) || 0,
      },
      { transaction: t }
    );

    rows.forEach((r) => (r.QuizAttemptId = attempt.id));
    await QuizAnswer.bulkCreate(rows, { transaction: t });

    await t.commit();
    res.json({
      message: "Quiz submitted",
      attemptId: attempt.id,
      quizId,
      score: total,
      maxScore: max,
      percent: max ? Number(((total / max) * 100).toFixed(2)) : 0,
      numQuestions: quizQuestions.length,
      correct: rows.filter((r) => r.is_correct).length,
    });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ message: e.message });
  }
};
