import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import api from "../services/api";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      await api.register({ name, email, password });
      setMsg("Registered! Redirecting...");
      setTimeout(() => nav("/login"), 800);
    } catch (e) {
      setMsg(e.message);
    }
  }
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <form
        onSubmit={submit}
        className="bg-white border rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <div className="text-xl font-semibold">Create account</div>
        {msg && <div className="text-sm text-gray-700">{msg}</div>}
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button className="w-full !bg-indigo-600 !text-white border-indigo-600">
          Register
        </Button>
        <div className="text-sm text-gray-600">
          Have an account?{" "}
          <Link to="/login" className="text-indigo-600">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
