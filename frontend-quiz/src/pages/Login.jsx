import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav(loc.state?.from?.pathname || "/dashboard");
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <form
        onSubmit={submit}
        className="bg-white border rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <div className="text-xl font-semibold">Welcome back</div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
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
          Login
        </Button>
        <div className="text-sm text-gray-600">
          No account?{" "}
          <Link to="/register" className="text-indigo-600">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}
