// config/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const sequelize = new Sequelize(
  process.env.MYSQLDATABASE,
  process.env.MYSQLUSER,
  process.env.MYSQLPASSWORD,
  {
    host: process.env.MYSQLHOST || "127.0.0.1",
    port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
    dialect: "mysql",
    logging: false,
    pool: { acquire: 20000 }, // optional: increase acquire timeout
  }
);
