// models/quizAttemptModel.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./userModel.js";
import Quiz from "./quizModel.js";

const QuizAttempt = sequelize.define("QuizAttempt", {
  total_score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  max_score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // new
  num_questions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // new
  duration_ms: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 }, // new (client can send duration)
});

// Relations
User.hasMany(QuizAttempt, { onDelete: "CASCADE" });
QuizAttempt.belongsTo(User);

Quiz.hasMany(QuizAttempt, { onDelete: "CASCADE" });
QuizAttempt.belongsTo(Quiz);

export default QuizAttempt;
