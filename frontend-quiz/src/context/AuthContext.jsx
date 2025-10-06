import { createContext, useContext, useMemo, useState, useEffect } from "react";
import api from "../services/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("jwt") || "");
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("me") || "null")
  );

  useEffect(() => {
    api.setToken(token);
  }, [token]);

  async function login(email, password) {
    const res = await api.login({ email, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem("jwt", res.token);
    localStorage.setItem("me", JSON.stringify(res.user));
  }
  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("jwt");
    localStorage.removeItem("me");
  }

  const value = useMemo(
    () => ({ token, user, login, logout, setUser }),
    [token, user]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
