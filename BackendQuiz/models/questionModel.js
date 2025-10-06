// models/questionModel.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Skill from "./skillModel.js";
import Quiz from "./quizModel.js";

const Question = sequelize.define("Question", {
  question_text: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }, // array of strings
  correct_answer: { type: DataTypes.STRING, allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }, // new
});

// Primary relation: Question → Quiz
Quiz.hasMany(Question, { onDelete: "CASCADE" });
Question.belongsTo(Quiz);

// Optional (keep for reporting / backward compat): Question → Skill
Skill.hasMany(Question);
Question.belongsTo(Skill);

export default Question;
