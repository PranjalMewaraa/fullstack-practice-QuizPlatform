import Quiz from "../models/quizModel.js";
import Question from "../models/questionModel.js";
import Skill from "../models/skillModel.js";

export const createQuiz = async (req, res) => {
  const { skillId } = req.params;
  const {
    title,
    description,
    time_limit_sec = 0,
    is_published = false,
  } = req.body;
  const skill = await Skill.findByPk(skillId);
  if (!skill) return res.status(404).json({ message: "Skill not found" });
  const quiz = await Quiz.create({
    title,
    description,
    time_limit_sec,
    is_published,
    SkillId: skillId,
  });
  res.json(quiz);
};
export const listQuizzesForSkill = async (req, res) => {
  const { skillId } = req.params;
  res.json(
    await Quiz.findAll({
      where: { SkillId: skillId },
      order: [["createdAt", "DESC"]],
    })
  );
};
export const getQuizWithQuestions = async (req, res) => {
  const { quizId } = req.params;
  const quiz = await Quiz.findByPk(quizId, {
    include: [{ model: Question, attributes: { exclude: ["correct_answer"] } }],
  });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  res.json(quiz);
};
export const updateQuiz = async (req, res) => {
  const { quizId } = req.params;
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  const { title, description, time_limit_sec, is_published } = req.body;
  if (title != null) quiz.title = title;
  if (description != null) quiz.description = description;
  if (time_limit_sec != null) quiz.time_limit_sec = time_limit_sec;
  if (is_published != null) quiz.is_published = is_published;
  await quiz.save();
  res.json(quiz);
};
export const deleteQuiz = async (req, res) => {
  const { quizId } = req.params;
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  await quiz.destroy();
  res.json({ message: "Quiz deleted" });
};
