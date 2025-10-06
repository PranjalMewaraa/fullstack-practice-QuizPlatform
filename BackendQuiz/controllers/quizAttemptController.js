import { sequelize } from "../config/db.js";
import Quiz from "../models/quizModel.js";
import Question from "../models/questionModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import QuizAnswer from "../models/quizAnswerModel.js";
import Skill from "../models/skillModel.js";

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
export const getAttemptsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;
    const withAnswers =
      String(req.query.withAnswers || "false").toLowerCase() === "true";
    const quizIdFilter = req.query.quizId ? Number(req.query.quizId) : null;

    const where = { UserId: userId };
    if (quizIdFilter) where.QuizId = quizIdFilter;

    const include = [
      {
        model: Quiz,
        attributes: ["id", "title", "description", "time_limit_sec"],
        include: [
          { model: Skill, attributes: ["id", "name"] },
          // we only need IDs here to compute total questions efficiently
          { model: Question, attributes: ["id"] },
        ],
      },
    ];

    if (withAnswers) {
      include.push({
        model: QuizAnswer,
        attributes: ["id", "selected_option", "is_correct", "points_earned"],
        include: [
          {
            model: Question,
            attributes: ["id", "question_text", "options", "correct_answer"],
            include: [{ model: Skill, attributes: ["id", "name"] }],
          },
        ],
      });
    } else {
      // still need counts of answers to compute 'attempted'
      include.push({
        model: QuizAnswer,
        attributes: ["id", "is_correct"],
      });
    }

    const { rows, count } = await QuizAttempt.findAndCountAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    const items = rows.map((a) => {
      const quiz = a.Quiz;
      const skill = quiz?.Skill;
      const allQCount = quiz?.Questions?.length || 0;
      const answers = a.QuizAnswers || [];
      const attempted = answers.length;
      const correct = answers.filter((x) => x.is_correct).length;
      const incorrect = Math.max(0, attempted - correct);
      const percent = a.max_score
        ? Number(
            ((Number(a.total_score || 0) / Number(a.max_score)) * 100).toFixed(
              2
            )
          )
        : 0;

      // optional per-question detail
      const answerDetails =
        withAnswers && answers.length
          ? answers.map((ans) => ({
              answerId: ans.id,
              questionId: ans.Question?.id,
              questionText: ans.Question?.question_text,
              options: ans.Question?.options ?? [],
              selectedOption: ans.selected_option,
              correctOption: ans.Question?.correct_answer, // returning since it’s the user’s own attempt
              isCorrect: !!ans.is_correct,
              pointsEarned: Number(ans.points_earned || 0),
              skillId: ans.Question?.Skill?.id ?? skill?.id ?? null,
              skillName: ans.Question?.Skill?.name ?? skill?.name ?? null,
            }))
          : undefined;

      return {
        attemptId: a.id,
        userId: a.UserId,
        quizId: quiz?.id,
        quizTitle: quiz?.title,
        quizDescription: quiz?.description,
        skillId: skill?.id ?? null,
        skillName: skill?.name ?? null,

        // scoring
        score: Number(a.total_score || 0),
        maxScore: Number(a.max_score || 0),
        percent,
        numQuestions: Number(a.num_questions || allQCount || 0),
        attemptedQuestions: Number(attempted || 0),
        correct,
        incorrect,

        // timing
        durationMs: Number(a.duration_ms || 0),
        timeLimitSec: Number(quiz?.time_limit_sec || 0),

        createdAt: a.createdAt,
        ...(withAnswers ? { answers: answerDetails } : {}),
      };
    });

    res.json({
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      items,
    });
  } catch (e) {
    console.error("getAttemptsByUserId error:", e);
    res.status(500).json({ message: e.message });
  }
};
