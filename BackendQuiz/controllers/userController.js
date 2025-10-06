import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async (req, res) => {
  const users = await User.findAll();
  res.json(users);
};

export const getUserById = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
};

export const updateUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (password) user.password = await bcrypt.hash(password, 10);
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;

  await user.save();
  res.json({ message: "User updated", user });
};

export const deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.destroy();
  res.json({ message: "User deleted" });
};
