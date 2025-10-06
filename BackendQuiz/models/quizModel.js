// models/quizModel.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import Skill from "./skillModel.js";

class Quiz extends Model {}
Quiz.init(
  {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    time_limit_sec: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }, // 0 = no limit
    is_published: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: "Quiz" }
);

Skill.hasMany(Quiz, { onDelete: "CASCADE" });
Quiz.belongsTo(Skill);

export default Quiz;
