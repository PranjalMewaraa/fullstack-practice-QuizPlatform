import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Skill = sequelize.define("Skill", {
  name: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.STRING,
});

export default Skill;
