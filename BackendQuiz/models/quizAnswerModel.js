// models/quizAnswerModel.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import QuizAttempt from "./quizAttemptModel.js";
import Question from "./questionModel.js";

const QuizAnswer = sequelize.define("QuizAnswer", {
  selected_option: { type: DataTypes.STRING, allowNull: false },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  points_earned: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // new
});

QuizAttempt.hasMany(QuizAnswer, { onDelete: "CASCADE" });
QuizAnswer.belongsTo(QuizAttempt);

Question.hasMany(QuizAnswer, { onDelete: "CASCADE" });
QuizAnswer.belongsTo(Question);

export default QuizAnswer;
